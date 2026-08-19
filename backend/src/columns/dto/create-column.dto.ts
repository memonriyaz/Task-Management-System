import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class CreateColumnDto {
  @ApiProperty({ example: 'REVIEW' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '#FF5722' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  position?: number;
}
