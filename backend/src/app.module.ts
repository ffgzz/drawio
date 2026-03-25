import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { DiagramEntity } from './modules/diagrams/entities/diagram.entity';
import { DiagramSnapshotEntity } from './modules/diagrams/entities/diagram-snapshot.entity';
import { DiagramCommitEntity } from './modules/diagrams/entities/diagram-commit.entity';
import { DiagramsController } from './modules/diagrams/diagrams.controller';
import { DiagramsService } from './modules/diagrams/diagrams.service';
import { DiagramsRepository } from './modules/diagrams/diagrams.repository';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join(process.cwd(), 'data', 'diagram.db'),
      entities: [DiagramEntity, DiagramSnapshotEntity, DiagramCommitEntity],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      DiagramEntity,
      DiagramSnapshotEntity,
      DiagramCommitEntity,
    ]),
  ],
  controllers: [DiagramsController],
  providers: [DiagramsService, DiagramsRepository],
})
export class AppModule {}
