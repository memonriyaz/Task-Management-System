import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsInt, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { SubtaskInputDto } from './create-task.dto';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Build UI for onboarding flow' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Design and build interactive onboarding steps' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'column-uuid-here' })
  @IsOptional()
  @IsString()
  columnId?: string;

  @ApiPropertyOptional({ example: 'project-uuid-here' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ example: 'workspace-uuid-here' })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({ example: ['user-uuid-1', 'user-uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];

  @ApiPropertyOptional({ example: 'Doing' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Urgent' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: '29 Jul' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Testing, Deployment' })
  @IsOptional()
  @IsString()
  labels?: string;

  @ApiPropertyOptional({ example: 'Admin' })
  @IsOptional()
  @IsString()
  assigneeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeAvatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resources?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  team?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reporter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  position?: number;

  @ApiPropertyOptional({ type: [SubtaskInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtaskInputDto)
  subtasks?: SubtaskInputDto[];
}
