import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class MoveTaskDto {
  @ApiProperty({ example: 'column-uuid-here' })
  @IsNotEmpty()
  @IsString()
  targetColumnId: string;

  @ApiProperty({ example: 0 })
  @IsNotEmpty()
  @IsInt()
  targetPosition: number;

  @ApiPropertyOptional({ example: 'DOING' })
  @IsOptional()
  @IsString()
  status?: string;
}
