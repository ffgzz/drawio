import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('diagram_snapshots')
@Index(['diagramId', 'version'], { unique: true })
export class DiagramSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  diagramId!: string;

  @Column({ type: 'int' })
  version!: number;

  @Column({ type: 'text' })
  snapshotJson!: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
