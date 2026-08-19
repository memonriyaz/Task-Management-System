import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ColumnInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'TODO' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '#49C4E5' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateBoardDto {
  @ApiProperty({ example: 'Platform Launch' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ type: [ColumnInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnInputDto)
  columns?: ColumnInputDto[];
}
