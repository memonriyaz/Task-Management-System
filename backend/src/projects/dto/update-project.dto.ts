import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Design Homepage' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Urgent' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'Ankit Dutta' })
  @IsOptional()
  @IsString()
  leadName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadAvatar?: string;

  @ApiPropertyOptional({ example: '18 Sep 2026' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Released' })
  @IsOptional()
  @IsString()
  status?: string;
}
