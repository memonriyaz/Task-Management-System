import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ColumnInputDto } from './create-board.dto';

export class UpdateBoardDto {
  @ApiPropertyOptional({ example: 'Platform Launch (Updated)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: [ColumnInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnInputDto)
  columns?: ColumnInputDto[];
}
