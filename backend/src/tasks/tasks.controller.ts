import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('tasks')
@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req: any) {
    return this.tasksService.create(createTaskDto, req.user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task details by ID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task details and subtasks' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to task' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  async addComment(
    @Param('id') id: string,
    @Body() body: { authorName?: string; content: string; authorAvatar?: string; parentId?: string },
  ) {
    return this.tasksService.addComment(
      id,
      body.authorName,
      body.content,
      body.authorAvatar,
      body.parentId,
    );
  }

  @Patch(':id/comments/:commentId')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({ status: 200, description: 'Comment updated' })
  async updateComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body('content') content: string,
  ) {
    return this.tasksService.updateComment(id, commentId, content);
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  async deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    return this.tasksService.deleteComment(id, commentId);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Move task to new column / position (Drag and Drop)' })
  @ApiResponse({ status: 200, description: 'Task moved successfully' })
  async move(@Param('id') id: string, @Body() moveTaskDto: MoveTaskDto) {
    return this.tasksService.move(id, moveTaskDto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get assigned members for a task' })
  @ApiResponse({ status: 200, description: 'List of assigned members' })
  async getMembers(@Param('id') id: string) {
    return this.tasksService.getTaskMembers(id);
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a workspace member to this task' })
  @ApiResponse({ status: 201, description: 'Member assigned to task' })
  async assignMember(
    @Param('id') id: string,
    @Body() body: { userId: string },
    @Request() req: any,
  ) {
    return this.tasksService.assignMember(id, body.userId, req.user?.id);
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove an assigned member from this task' })
  @ApiResponse({ status: 200, description: 'Member removed from task' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.tasksService.removeMember(id, userId, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task by ID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
