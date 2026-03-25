import { IsArray, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateDiagramCommitDto {
  @IsInt()
  @Min(0)
  baseVersion!: number;

  @IsString()
  actorId!: string;

  @IsArray()
  touchedObjectIds!: string[];

  @IsArray()
  changes!: any[];

  @IsOptional()
  @IsObject()
  snapshot?: Record<string, any>;
}
