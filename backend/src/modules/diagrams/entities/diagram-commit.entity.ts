import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('diagram_commits')
@Index(['diagramId', 'resultVersion'], { unique: true })
export class DiagramCommitEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  diagramId!: string;

  @Column({ type: 'varchar', length: 64 })
  commitId!: string;

  @Column({ type: 'int' })
  baseVersion!: number;

  @Column({ type: 'int' })
  resultVersion!: number;

  @Column({ type: 'varchar', length: 128 })
  actorId!: string;

  @Column({ type: 'varchar', length: 32 })
  commitType!: string;

  @Column({ type: 'text' })
  touchedObjectIdsJson!: string;

  @Column({ type: 'text' })
  changesJson!: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
