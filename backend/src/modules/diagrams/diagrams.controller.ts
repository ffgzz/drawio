import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateDiagramDto } from './dto/create-diagram.dto';
import { SaveDiagramSnapshotDto } from './dto/save-diagram-snapshot.dto';
import { CreateDiagramCommitDto } from './dto/create-diagram-commit.dto';
import { RollbackDiagramDto } from './dto/rollback-diagram.dto';
import { DiagramsService } from './diagrams.service';

@Controller('diagrams')
export class DiagramsController {
  constructor(private readonly diagramsService: DiagramsService) {}

  @Get()
  listDiagrams() {
    return this.diagramsService.listDiagrams();
  }

  @Post()
  createDiagram(@Body() dto: CreateDiagramDto) {
    return this.diagramsService.createDiagram(dto);
  }

  @Get(':diagramId')
  async getLatestDiagram(@Param('diagramId') diagramId: string) {
    const snapshot = await this.diagramsService.getLatestSnapshot(diagramId);
    if (snapshot == null) {
      throw new NotFoundException('图纸不存在');
    }
    return snapshot;
  }

  @Put(':diagramId/snapshot')
  saveSnapshot(
    @Param('diagramId') diagramId: string,
    @Body() dto: SaveDiagramSnapshotDto,
  ) {
    return this.diagramsService.saveSnapshot(diagramId, dto);
  }

  @Post(':diagramId/commits')
  async createCommit(
    @Param('diagramId') diagramId: string,
    @Body() dto: CreateDiagramCommitDto,
  ) {
    try {
      return await this.diagramsService.createCommit(diagramId, dto);
    } catch (error: any) {
      if (error?.name === 'DiagramConflictError') {
        throw new ConflictException(error.payload);
      }
      throw error;
    }
  }

  @Get(':diagramId/history')
  getHistory(@Param('diagramId') diagramId: string) {
    return this.diagramsService.getHistory(diagramId);
  }

  @Post(':diagramId/rollback')
  rollback(
    @Param('diagramId') diagramId: string,
    @Body() dto: RollbackDiagramDto,
  ) {
    return this.diagramsService.rollback(diagramId, dto);
  }
}
