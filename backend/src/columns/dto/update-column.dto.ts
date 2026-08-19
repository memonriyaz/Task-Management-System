import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateColumnDto {
  @ApiPropertyOptional({ example: 'IN REVIEW' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '#FF5722' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  position?: number;
}
