import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class ColumnsService {
  constructor(private prisma: PrismaService) {}

  async create(boardId: string, createColumnDto: CreateColumnDto) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { columns: true },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    const defaultColors = ['#49C4E5', '#8471F2', '#67E2AE', '#FF5722', '#E91E63', '#00BCD4'];
    const position =
      createColumnDto.position !== undefined
        ? createColumnDto.position
        : board.columns.length;

    const color =
      createColumnDto.color || defaultColors[position % defaultColors.length];

    return this.prisma.column.create({
      data: {
        name: createColumnDto.name.trim(),
        color,
        position,
        boardId,
      },
      include: {
        tasks: {
          include: { subtasks: true },
        },
      },
    });
  }

  async update(id: string, updateColumnDto: UpdateColumnDto) {
    const col = await this.prisma.column.findUnique({ where: { id } });
    if (!col) {
      throw new NotFoundException(`Column with ID ${id} not found`);
    }

    return this.prisma.column.update({
      where: { id },
      data: {
        ...(updateColumnDto.name && { name: updateColumnDto.name.trim() }),
        ...(updateColumnDto.color && { color: updateColumnDto.color }),
        ...(updateColumnDto.position !== undefined && {
          position: updateColumnDto.position,
        }),
      },
      include: {
        tasks: {
          include: { subtasks: true },
        },
      },
    });
  }

  async remove(id: string) {
    const col = await this.prisma.column.findUnique({ where: { id } });
    if (!col) {
      throw new NotFoundException(`Column with ID ${id} not found`);
    }

    return this.prisma.column.delete({
      where: { id },
    });
  }

  async reorderColumns(boardId: string, columnIds: string[]) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });
    if (!board) {
      throw new NotFoundException(`Board with ID ${boardId} not found`);
    }

    return this.prisma.$transaction(
      columnIds.map((id, index) =>
        this.prisma.column.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );
  }
}
