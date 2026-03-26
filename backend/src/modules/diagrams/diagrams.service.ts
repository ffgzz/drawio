import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateDiagramDto } from './dto/create-diagram.dto';
import { SaveDiagramSnapshotDto } from './dto/save-diagram-snapshot.dto';
import { CreateDiagramCommitDto } from './dto/create-diagram-commit.dto';
import { RollbackDiagramDto } from './dto/rollback-diagram.dto';
import { DiagramsRepository } from './diagrams.repository';
import {
  DiagramChangeRecord,
  DiagramCommitRecord,
  DiagramSnapshotRecord,
} from './diagram.types';

class DiagramConflictError extends Error {
  constructor(public readonly payload: Record<string, any>) {
    super('Diagram conflict');
    this.name = 'DiagramConflictError';
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
      title: dto.title || '未命名图纸',
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
    if (dto.baseVersion !== diagram.latestVersion) {
      throw new DiagramConflictError({
        message: '图纸版本冲突',
        latestVersion: diagram.latestVersion,
        conflictingObjectIds: [],
      });
    }
    const nextVersion = diagram.latestVersion + 1;
    const snapshot = this.normalizeSnapshot(diagramId, nextVersion, dto.snapshot);
    const commit = this.buildFullSnapshotCommit(
      diagramId,
      dto.actorId,
      diagram.latestVersion,
      nextVersion,
      snapshot,
    );
    await this.persistVersion(diagram, snapshot, commit);
    return { diagramId, title: diagram.title, version: nextVersion, snapshot, commit };
  }

  async createCommit(diagramId: string, dto: CreateDiagramCommitDto) {
    const diagram = await this.requireDiagram(diagramId);
    const latestSnapshot = await this.requireLatestSnapshot(diagramId);

    if (dto.baseVersion > diagram.latestVersion) {
      throw new DiagramConflictError({
        message: 'baseVersion 超过当前最新版本',
        latestVersion: diagram.latestVersion,
        conflictingObjectIds: [],
      });
    }

    if (dto.baseVersion < diagram.latestVersion) {
      const commits = await this.repository.findCommitsAfterVersion(diagramId, dto.baseVersion);
      const touched = new Set(dto.touchedObjectIds || []);
      const conflictingObjectIds = new Set<string>();
      commits.forEach((commitEntity) => {
        const ids = JSON.parse(commitEntity.touchedObjectIdsJson || '[]');
        ids.forEach((id: string) => {
          if (touched.has(id)) {
            conflictingObjectIds.add(id);
          }
        });
      });
      if (conflictingObjectIds.size > 0) {
        throw new DiagramConflictError({
          message: '图纸版本冲突',
          latestVersion: diagram.latestVersion,
          conflictingObjectIds: Array.from(conflictingObjectIds),
        });
      }
    }

    const nextVersion = diagram.latestVersion + 1;
    const snapshot = dto.snapshot != null
      ? this.normalizeSnapshot(diagramId, nextVersion, dto.snapshot)
      : this.applyChanges(this.clone(latestSnapshot), dto.changes || [], diagramId, nextVersion);
    const commit: DiagramCommitRecord = {
      commitId: randomUUID(),
      diagramId,
      baseVersion: dto.baseVersion,
      resultVersion: nextVersion,
      actorId: dto.actorId,
      commitType: 'normal',
      createdAt: new Date().toISOString(),
      touchedObjectIds: this.uniqueArray(dto.touchedObjectIds || []),
      changes: (dto.changes || []) as DiagramChangeRecord[],
    };
    await this.persistVersion(diagram, snapshot, commit);
    return { diagramId, title: diagram.title, version: nextVersion, snapshot, commit };
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
        touchedObjectIds: JSON.parse(item.touchedObjectIdsJson || '[]'),
        changes: JSON.parse(item.changesJson || '[]'),
        createdAt: item.createdAt,
      })),
    };
  }

  async rollback(diagramId: string, dto: RollbackDiagramDto) {
    const diagram = await this.requireDiagram(diagramId);
    const targetSnapshot = await this.requireSnapshot(diagramId, dto.targetVersion);
    const currentSnapshot = await this.requireLatestSnapshot(diagramId);
    const nextVersion = diagram.latestVersion + 1;
    const snapshot = this.normalizeSnapshot(diagramId, nextVersion, targetSnapshot);
    const touchedObjectIds = this.uniqueArray(
      this.collectSnapshotObjectIds(currentSnapshot).concat(
        this.collectSnapshotObjectIds(targetSnapshot),
      ),
    );
    const commit: DiagramCommitRecord = {
      commitId: randomUUID(),
      diagramId,
      baseVersion: diagram.latestVersion,
      resultVersion: nextVersion,
      actorId: dto.actorId,
      commitType: 'rollback',
      createdAt: new Date().toISOString(),
      touchedObjectIds,
      changes: [{
        objectType: 'object',
        objectId: '__rollback__',
        op: 'update',
        before: { version: currentSnapshot.version },
        after: { version: dto.targetVersion },
      }],
    };
    await this.persistVersion(diagram, snapshot, commit);
    return { diagramId, title: diagram.title, version: nextVersion, snapshot, commit };
  }

  private async requireDiagram(diagramId: string) {
    const diagram = await this.repository.findDiagram(diagramId);
    if (diagram == null) {
      throw new NotFoundException('图纸不存在');
    }
    return diagram;
  }

  private async requireSnapshot(diagramId: string, version: number) {
    const entity = await this.repository.findSnapshot(diagramId, version);
    if (entity == null) {
      throw new NotFoundException('指定版本不存在');
    }
    return JSON.parse(entity.snapshotJson) as DiagramSnapshotRecord;
  }

  private async requireLatestSnapshot(diagramId: string) {
    const entity = await this.repository.findLatestSnapshot(diagramId);
    if (entity == null) {
      throw new NotFoundException('图纸不存在');
    }
    return JSON.parse(entity.snapshotJson) as DiagramSnapshotRecord;
  }

  private async persistVersion(diagram: any, snapshot: DiagramSnapshotRecord, commit: DiagramCommitRecord) {
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

  private buildFullSnapshotCommit(diagramId: string, actorId: string, baseVersion: number, resultVersion: number, snapshot: DiagramSnapshotRecord): DiagramCommitRecord {
    return {
      commitId: randomUUID(),
      diagramId,
      baseVersion,
      resultVersion,
      actorId,
      commitType: 'normal',
      createdAt: new Date().toISOString(),
      touchedObjectIds: this.collectSnapshotObjectIds(snapshot),
      changes: [{
        objectType: 'object',
        objectId: '__snapshot__',
        op: 'update',
        before: { version: baseVersion },
        after: { version: resultVersion },
      }],
    };
  }

  private normalizeSnapshot(diagramId: string, version: number, raw: Record<string, any>): DiagramSnapshotRecord {
    return {
      diagramId,
      version,
      updatedAt: new Date().toISOString(),
      objects: Array.isArray(raw.objects) ? this.clone(raw.objects) : [],
      edges: Array.isArray(raw.edges) ? this.clone(raw.edges) : [],
    };
  }

  private applyChanges(baseSnapshot: DiagramSnapshotRecord, changes: DiagramChangeRecord[], diagramId: string, version: number) {
    const snapshot = this.normalizeSnapshot(diagramId, version, baseSnapshot as any);
    const objectMap = new Map(snapshot.objects.map((item) => [item.id, item]));
    const edgeMap = new Map(snapshot.edges.map((item) => [item.id, item]));
    changes.forEach((change) => {
      const targetMap = change.objectType === 'edge' ? edgeMap : objectMap;
      if (change.op === 'delete') {
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
      snapshot.objects.map((item) => item.id).concat(snapshot.edges.map((item) => item.id)),
    );
  }

  private uniqueArray(list: string[]) {
    return Array.from(new Set((list || []).filter(Boolean)));
  }

  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
}


