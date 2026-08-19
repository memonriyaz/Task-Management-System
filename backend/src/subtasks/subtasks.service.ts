import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';

@Injectable()
export class SubtasksService {
  constructor(private prisma: PrismaService) {}

  async toggle(id: string) {
    const subtask = await this.prisma.subtask.findUnique({
      where: { id },
    });

    if (!subtask) {
      throw new NotFoundException(`Subtask with ID ${id} not found`);
    }

    return this.prisma.subtask.update({
      where: { id },
      data: { isCompleted: !subtask.isCompleted },
    });
  }

  async update(id: string, updateSubtaskDto: UpdateSubtaskDto) {
    const subtask = await this.prisma.subtask.findUnique({
      where: { id },
    });

    if (!subtask) {
      throw new NotFoundException(`Subtask with ID ${id} not found`);
    }

    return this.prisma.subtask.update({
      where: { id },
      data: {
        ...(updateSubtaskDto.title !== undefined && {
          title: updateSubtaskDto.title.trim(),
        }),
        ...(updateSubtaskDto.isCompleted !== undefined && {
          isCompleted: updateSubtaskDto.isCompleted,
        }),
      },
    });
  }
}
