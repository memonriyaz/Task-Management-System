import { Controller, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@ApiTags('columns')
@Controller('api/columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Post(':boardId')
  @ApiOperation({ summary: 'Add a new column to a board' })
  @ApiResponse({ status: 201, description: 'Column created successfully' })
  async create(
    @Param('boardId') boardId: string,
    @Body() createColumnDto: CreateColumnDto,
  ) {
    return this.columnsService.create(boardId, createColumnDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update column name, color, or position' })
  @ApiResponse({ status: 200, description: 'Column updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateColumnDto: UpdateColumnDto,
  ) {
    return this.columnsService.update(id, updateColumnDto);
  }

  @Post('reorder/:boardId')
  @ApiOperation({ summary: 'Reorder columns in a board' })
  @ApiResponse({ status: 200, description: 'Columns reordered successfully' })
  async reorder(
    @Param('boardId') boardId: string,
    @Body() body: { columnIds: string[] },
  ) {
    return this.columnsService.reorderColumns(boardId, body.columnIds);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete column by ID' })
  @ApiResponse({ status: 200, description: 'Column deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.columnsService.remove(id);
  }
}
