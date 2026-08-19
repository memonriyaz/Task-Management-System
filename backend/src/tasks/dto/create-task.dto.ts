import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SubtaskInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Sign up page' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'High' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: '12 Sep 2026' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Admin' })
  @IsOptional()
  @IsString()
  assigneeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeAvatar?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isCompleted?: boolean;
}

export class CreateTaskDto {
  @ApiProperty({ example: 'Build UI for onboarding flow' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Design and build interactive onboarding steps' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'column-uuid-here' })
  @IsNotEmpty()
  @IsString()
  columnId: string;

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

  @ApiPropertyOptional({ example: 'To Do' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'High' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: '29 Jul' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Deployment, Research' })
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
