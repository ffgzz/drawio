import { IsInt, IsString, Min } from 'class-validator';

export class RollbackDiagramDto {
  @IsInt()
  @Min(1)
  targetVersion!: number;

  @IsString()
  actorId!: string;
}
