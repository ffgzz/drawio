import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { CreateDiagramDto } from "./dto/create-diagram.dto";
import { SaveDiagramSnapshotDto } from "./dto/save-diagram-snapshot.dto";
import { CreateDiagramCommitDto } from "./dto/create-diagram-commit.dto";
import { RollbackDiagramDto } from "./dto/rollback-diagram.dto";
import { DiagramsRepository } from "./diagrams.repository";
import {
  DiagramChangeRecord,
  DiagramCommitRecord,
  DiagramSnapshotRecord,
} from "./diagram.types";

class DiagramConflictError extends Error {
  constructor(public readonly payload: Record<string, any>) {
    super("Diagram conflict");
    this.name = "DiagramConflictError";
  }
}

@Injectable()
export class DiagramsService {
  constructor(private readonly repository: DiagramsRepository) {}

  async listDiagrams() {
    const diagrams = await this.repository.findAllDiagrams();
    return {
      diagrams: diagrams.map((item) => ({
        diagramId: item.id,
        title: item.title,
        latestVersion: item.latestVersion,
        updatedAt: item.updatedAt,
      })),
    };
  }

  async createDiagram(dto: CreateDiagramDto) {
    const id = randomUUID();
    const diagram = await this.repository.createDiagram({
      id,
      title: dto.title || "未命名图纸",
      latestVersion: 0,
    });
    const snapshot: DiagramSnapshotRecord = {
      diagramId: id,
      version: 0,
      updatedAt: new Date().toISOString(),
      objects: [],
      edges: [],
    };
    await this.repository.saveSnapshot({
      diagramId: id,
      version: 0,
      snapshotJson: JSON.stringify(snapshot),
    });
    return {
      diagramId: diagram.id,
      title: diagram.title,
      latestVersion: diagram.latestVersion,
      snapshot,
    };
  }

  async getLatestSnapshot(diagramId: string) {
    const snapshot = await this.repository.findLatestSnapshot(diagramId);
    return snapshot ? JSON.parse(snapshot.snapshotJson) : null;
  }

  async saveSnapshot(diagramId: string, dto: SaveDiagramSnapshotDto) {
    const diagram = await this.requireDiagram(diagramId);
    const latestSnapshot = await this.requireLatestSnapshot(diagramId);
    if (dto.baseVersion !== diagram.latestVersion) {
      throw new DiagramConflictError({
        message: "图纸版本冲突",
        latestVersion: diagram.latestVersion,
        conflictingObjectIds: [],
      });
    }
    const nextVersion = diagram.latestVersion + 1;
    const snapshot = this.normalizeSnapshot(
      diagramId,
      nextVersion,
      dto.snapshot,
    );
    const diff = this.computeSnapshotChanges(latestSnapshot, snapshot);
    const commit = this.buildCommitRecord(
      diagramId,
      dto.actorId,
      diagram.latestVersion,
      nextVersion,
      "normal",
      diff.touchedObjectIds,
      diff.changes,
    );
    await this.persistVersion(diagram, snapshot, commit);
    return {
      diagramId,
      title: diagram.title,
      version: nextVersion,
      snapshot,
      commit,
    };
  }

  async createCommit(diagramId: string, dto: CreateDiagramCommitDto) {
    const diagram = await this.requireDiagram(diagramId);
    const latestSnapshot = await this.requireLatestSnapshot(diagramId);

    if (dto.baseVersion > diagram.latestVersion) {
      throw new DiagramConflictError({
        message: "baseVersion 超过当前最新版本",
        latestVersion: diagram.latestVersion,
        conflictingObjectIds: [],
      });
    }

    if (dto.baseVersion < diagram.latestVersion) {
      const commits = await this.repository.findCommitsAfterVersion(
        diagramId,
        dto.baseVersion,
      );
      const touched = new Set(dto.touchedObjectIds || []);
      const conflictingObjectIds = new Set<string>();
      commits.forEach((commitEntity) => {
        const ids = JSON.parse(commitEntity.touchedObjectIdsJson || "[]");
        ids.forEach((id: string) => {
          if (touched.has(id)) {
            conflictingObjectIds.add(id);
          }
        });
      });
      if (conflictingObjectIds.size > 0) {
        throw new DiagramConflictError({
          message: "图纸版本冲突",
          latestVersion: diagram.latestVersion,
          conflictingObjectIds: Array.from(conflictingObjectIds),
        });
      }
    }

    const nextVersion = diagram.latestVersion + 1;
    const snapshot =
      dto.snapshot != null
        ? this.normalizeSnapshot(diagramId, nextVersion, dto.snapshot)
        : this.applyChanges(
            this.clone(latestSnapshot),
            dto.changes || [],
            diagramId,
            nextVersion,
          );
    const commit = this.buildCommitRecord(
      diagramId,
      dto.actorId,
      dto.baseVersion,
      nextVersion,
      "normal",
      dto.touchedObjectIds || [],
      (dto.changes || []) as DiagramChangeRecord[],
    );
    await this.persistVersion(diagram, snapshot, commit);
    return {
      diagramId,
      title: diagram.title,
      version: nextVersion,
      snapshot,
      commit,
    };
  }

  async getHistory(diagramId: string) {
    await this.requireDiagram(diagramId);
    const commits = await this.repository.findCommitHistory(diagramId);
    return {
      diagramId,
      commits: commits.map((item) => ({
        commitId: item.commitId,
        baseVersion: item.baseVersion,
        resultVersion: item.resultVersion,
        actorId: item.actorId,
        commitType: item.commitType,
        touchedObjectIds: JSON.parse(item.touchedObjectIdsJson || "[]"),
        changes: JSON.parse(item.changesJson || "[]"),
        createdAt: item.createdAt,
      })),
    };
  }

  async rollback(diagramId: string, dto: RollbackDiagramDto) {
    const diagram = await this.requireDiagram(diagramId);
    const currentSnapshot = await this.requireLatestSnapshot(diagramId);
    const targetVersion = Math.max(0, dto.targetVersion);

    if (targetVersion > diagram.latestVersion) {
      throw new DiagramConflictError({
        message: "目标版本超过当前最新版本",
        latestVersion: diagram.latestVersion,
        conflictingObjectIds: [],
      });
    }

    if (targetVersion === diagram.latestVersion) {
      return {
        diagramId,
        title: diagram.title,
        version: diagram.latestVersion,
        snapshot: currentSnapshot,
        commit: null,
      };
    }

    await this.requireSnapshot(diagramId, targetVersion);
    const commitsToRollback = await this.repository.findCommitsInVersionRange(
      diagramId,
      targetVersion,
      diagram.latestVersion,
    );
    const nextVersion = diagram.latestVersion + 1;
    const rollbackChanges = this.buildRollbackChanges(commitsToRollback);
    const snapshot = this.applyChanges(
      this.clone(currentSnapshot),
      rollbackChanges,
      diagramId,
      nextVersion,
    );
    const commit = this.buildCommitRecord(
      diagramId,
      dto.actorId,
      diagram.latestVersion,
      nextVersion,
      "rollback",
      this.uniqueArray(
        rollbackChanges
          .map((change) => change.objectId)
          .concat(
            this.collectSnapshotObjectIds(currentSnapshot),
            this.collectSnapshotObjectIds(snapshot),
          ),
      ),
      rollbackChanges.concat([
        {
          objectType: "object",
          objectId: "__rollback__",
          op: "update",
          sequence: nextVersion,
          createdAt: new Date().toISOString(),
          before: { version: currentSnapshot.version },
          after: { version: targetVersion },
        },
      ]),
    );
    await this.persistVersion(diagram, snapshot, commit);
    return {
      diagramId,
      title: diagram.title,
      version: nextVersion,
      snapshot,
      commit,
    };
  }

  private async requireDiagram(diagramId: string) {
    const diagram = await this.repository.findDiagram(diagramId);
    if (diagram == null) {
      throw new NotFoundException("图纸不存在");
    }
    return diagram;
  }

  private async requireSnapshot(diagramId: string, version: number) {
    const entity = await this.repository.findSnapshot(diagramId, version);
    if (entity == null) {
      throw new NotFoundException("指定版本不存在");
    }
    return JSON.parse(entity.snapshotJson) as DiagramSnapshotRecord;
  }

  private async requireLatestSnapshot(diagramId: string) {
    const entity = await this.repository.findLatestSnapshot(diagramId);
    if (entity == null) {
      throw new NotFoundException("图纸不存在");
    }
    return JSON.parse(entity.snapshotJson) as DiagramSnapshotRecord;
  }

  private async persistVersion(
    diagram: any,
    snapshot: DiagramSnapshotRecord,
    commit: DiagramCommitRecord,
  ) {
    diagram.latestVersion = snapshot.version;
    await this.repository.saveDiagram(diagram);
    await this.repository.saveSnapshot({
      diagramId: snapshot.diagramId,
      version: snapshot.version,
      snapshotJson: JSON.stringify(snapshot),
    });
    await this.repository.saveCommit({
      diagramId: commit.diagramId,
      commitId: commit.commitId,
      baseVersion: commit.baseVersion,
      resultVersion: commit.resultVersion,
      actorId: commit.actorId,
      commitType: commit.commitType,
      touchedObjectIdsJson: JSON.stringify(commit.touchedObjectIds || []),
      changesJson: JSON.stringify(commit.changes || []),
    });
  }

  private buildCommitRecord(
    diagramId: string,
    actorId: string,
    baseVersion: number,
    resultVersion: number,
    commitType: "normal" | "rollback",
    touchedObjectIds: string[],
    changes: DiagramChangeRecord[],
  ): DiagramCommitRecord {
    return {
      commitId: randomUUID(),
      diagramId,
      baseVersion,
      resultVersion,
      actorId,
      commitType,
      createdAt: new Date().toISOString(),
      touchedObjectIds: this.uniqueArray(touchedObjectIds || []),
      changes: this.clone(changes || []),
    };
  }

  private normalizeSnapshot(
    diagramId: string,
    version: number,
    raw: Record<string, any>,
  ): DiagramSnapshotRecord {
    return {
      diagramId,
      version,
      updatedAt: new Date().toISOString(),
      objects: Array.isArray(raw.objects) ? this.clone(raw.objects) : [],
      edges: Array.isArray(raw.edges) ? this.clone(raw.edges) : [],
    };
  }

  private applyChanges(
    baseSnapshot: DiagramSnapshotRecord,
    changes: DiagramChangeRecord[],
    diagramId: string,
    version: number,
  ) {
    const snapshot = this.normalizeSnapshot(
      diagramId,
      version,
      baseSnapshot as any,
    );
    const objectMap = new Map(snapshot.objects.map((item) => [item.id, item]));
    const edgeMap = new Map(snapshot.edges.map((item) => [item.id, item]));
    changes.forEach((change) => {
      if (
        change.objectId === "__rollback__" ||
        change.objectId === "__snapshot__"
      ) {
        return;
      }
      const targetMap = change.objectType === "edge" ? edgeMap : objectMap;
      if (change.op === "delete") {
        targetMap.delete(change.objectId);
      } else {
        targetMap.set(change.objectId, this.clone(change.after || {}));
      }
    });
    snapshot.objects = Array.from(objectMap.values());
    snapshot.edges = Array.from(edgeMap.values());
    snapshot.updatedAt = new Date().toISOString();
    return snapshot;
  }

  private collectSnapshotObjectIds(snapshot: DiagramSnapshotRecord) {
    return this.uniqueArray(
      snapshot.objects
        .map((item) => item.id)
        .concat(snapshot.edges.map((item) => item.id)),
    );
  }

  private computeSnapshotChanges(
    previousSnapshot: DiagramSnapshotRecord,
    nextSnapshot: DiagramSnapshotRecord,
  ) {
    const previousMap = this.indexSnapshotEntries(previousSnapshot);
    const nextMap = this.indexSnapshotEntries(nextSnapshot);
    const keys = new Set<string>([
      ...Object.keys(previousMap),
      ...Object.keys(nextMap),
    ]);
    const changes: DiagramChangeRecord[] = [];
    const touchedObjectIds: string[] = [];

    keys.forEach((key) => {
      const previousValue = previousMap[key] ?? null;
      const nextValue = nextMap[key] ?? null;
      const objectType = key.startsWith("edge:") ? "edge" : "object";
      const objectId = key.substring(key.indexOf(":") + 1);
      let op: DiagramChangeRecord["op"] | null = null;

      if (previousValue == null && nextValue != null) {
        op = "create";
      } else if (previousValue != null && nextValue == null) {
        op = "delete";
      } else if (JSON.stringify(previousValue) !== JSON.stringify(nextValue)) {
        op = "update";
      }

      if (op != null) {
        changes.push({
          objectType,
          objectId,
          op,
          before: previousValue != null ? this.clone(previousValue) : null,
          after: nextValue != null ? this.clone(nextValue) : null,
        });
        touchedObjectIds.push(objectId);
      }
    });

    return {
      touchedObjectIds: this.uniqueArray(touchedObjectIds),
      changes,
    };
  }

  private indexSnapshotEntries(snapshot: DiagramSnapshotRecord) {
    const map: Record<string, any> = {};

    (snapshot.objects || []).forEach((item) => {
      if (item != null && item.id) {
        map[`object:${item.id}`] = this.clone(item);
      }
    });

    (snapshot.edges || []).forEach((item) => {
      if (item != null && item.id) {
        map[`edge:${item.id}`] = this.clone(item);
      }
    });

    return map;
  }

  private buildRollbackChanges(
    commits: Array<{ changesJson?: string | null }>,
  ) {
    const rollbackChanges: DiagramChangeRecord[] = [];

    commits.forEach((commitEntity) => {
      const changes = JSON.parse(
        commitEntity.changesJson || "[]",
      ) as DiagramChangeRecord[];

      for (let i = changes.length - 1; i >= 0; i -= 1) {
        const change = changes[i];

        if (
          change == null ||
          change.objectId === "__rollback__" ||
          change.objectId === "__snapshot__"
        ) {
          continue;
        }

        rollbackChanges.push(this.invertChange(change));
      }
    });

    return rollbackChanges;
  }

  private invertChange(change: DiagramChangeRecord): DiagramChangeRecord {
    if (change.op === "create") {
      return {
        objectType: change.objectType,
        objectId: change.objectId,
        op: "delete",
        before: this.clone(change.after || null),
        after: null,
      };
    }

    if (change.op === "delete") {
      return {
        objectType: change.objectType,
        objectId: change.objectId,
        op: "create",
        before: null,
        after: this.clone(change.before || null),
      };
    }

    return {
      objectType: change.objectType,
      objectId: change.objectId,
      op: "update",
      before: this.clone(change.after || null),
      after: this.clone(change.before || null),
    };
  }

  private uniqueArray(list: string[]) {
    return Array.from(new Set((list || []).filter(Boolean)));
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
}
