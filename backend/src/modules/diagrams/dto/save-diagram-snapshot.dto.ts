import { IsInt, IsObject, IsString, Min } from 'class-validator';

export class SaveDiagramSnapshotDto {
  @IsInt()
  @Min(0)
  baseVersion!: number;

  @IsString()
  actorId!: string;

  @IsObject()
  snapshot!: Record<string, any>;
}
