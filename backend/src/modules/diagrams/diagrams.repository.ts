import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThan, Repository } from 'typeorm';
import { DiagramEntity } from './entities/diagram.entity';
import { DiagramSnapshotEntity } from './entities/diagram-snapshot.entity';
import { DiagramCommitEntity } from './entities/diagram-commit.entity';

@Injectable()
export class DiagramsRepository {
  constructor(
    @InjectRepository(DiagramEntity)
    private readonly diagramsRepo: Repository<DiagramEntity>,
    @InjectRepository(DiagramSnapshotEntity)
    private readonly snapshotsRepo: Repository<DiagramSnapshotEntity>,
    @InjectRepository(DiagramCommitEntity)
    private readonly commitsRepo: Repository<DiagramCommitEntity>,
  ) {}

  createDiagram(diagram: Partial<DiagramEntity>) {
    return this.diagramsRepo.save(this.diagramsRepo.create(diagram));
  }

  findAllDiagrams() {
    return this.diagramsRepo.find({ order: { updatedAt: 'DESC' } });
  }

  findDiagram(diagramId: string) {
    return this.diagramsRepo.findOne({ where: { id: diagramId } });
  }

  saveDiagram(diagram: DiagramEntity) {
    return this.diagramsRepo.save(diagram);
  }

  saveSnapshot(snapshot: Partial<DiagramSnapshotEntity>) {
    return this.snapshotsRepo.save(this.snapshotsRepo.create(snapshot));
  }

  saveCommit(commit: Partial<DiagramCommitEntity>) {
    return this.commitsRepo.save(this.commitsRepo.create(commit));
  }

  findSnapshot(diagramId: string, version: number) {
    return this.snapshotsRepo.findOne({ where: { diagramId, version } });
  }

  findLatestSnapshot(diagramId: string) {
    return this.snapshotsRepo.findOne({
      where: { diagramId },
      order: { version: 'DESC' },
    });
  }

  findCommitsAfterVersion(diagramId: string, version: number) {
    return this.commitsRepo.find({
      where: { diagramId, resultVersion: MoreThan(version) },
      order: { resultVersion: 'ASC' },
    });
  }

  findCommitsInVersionRange(diagramId: string, fromVersionExclusive: number, toVersionInclusive: number) {
    return this.commitsRepo.find({
      where: {
        diagramId,
        resultVersion: Between(fromVersionExclusive + 1, toVersionInclusive),
      },
      order: { resultVersion: 'DESC' },
    });
  }

  findCommitHistory(diagramId: string) {
    return this.commitsRepo.find({
      where: { diagramId },
      order: { resultVersion: 'DESC' },
    });
  }
}
