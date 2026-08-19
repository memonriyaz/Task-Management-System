import { Controller, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubtasksService } from './subtasks.service';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';

@ApiTags('subtasks')
@Controller('api/subtasks')
export class SubtasksController {
  constructor(private readonly subtasksService: SubtasksService) {}

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle subtask completion status' })
  @ApiResponse({ status: 200, description: 'Subtask status toggled' })
  async toggle(@Param('id') id: string) {
    return this.subtasksService.toggle(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subtask title or completion state' })
  @ApiResponse({ status: 200, description: 'Subtask updated' })
  async update(
    @Param('id') id: string,
    @Body() updateSubtaskDto: UpdateSubtaskDto,
  ) {
    return this.subtasksService.update(id, updateSubtaskDto);
  }
}
