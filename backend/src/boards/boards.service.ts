import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, workspaceId?: string) {
    const userMemberships = await this.prisma.workspaceMember.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { workspaceId: true },
    });
    const workspaceIds = userMemberships.map((m) => m.workspaceId);

    let where: any;
    if (workspaceId) {
      where = { workspaceId };
    } else {
      where = {
        OR: [
          { userId },
          { workspaceId: { in: workspaceIds } },
        ],
      };
    }

    let boards = await this.prisma.board.findMany({
      where,
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              where: workspaceId ? { workspaceId } : undefined,
              orderBy: { position: 'asc' },
              include: {
                taskMembers: {
                  include: {
                    user: {
                      select: { id: true, name: true, email: true, avatar: true, username: true },
                    },
                  },
                },
                subtasks: { orderBy: { createdAt: 'asc' } },
                comments: { orderBy: { createdAt: 'asc' } },
                activities: { orderBy: { createdAt: 'desc' } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (boards.length === 0 && workspaceId) {
      const defaultBoard = await this.create(userId, { name: 'Tasks' });
      await this.prisma.board.update({
        where: { id: defaultBoard.id },
        data: { workspaceId },
      });
      boards = [await this.findOne(defaultBoard.id, userId)];
    }

    return boards;
  }

  async findOne(id: string, userId?: string) {
    let where: any = { id };
    if (userId) {
      const userMemberships = await this.prisma.workspaceMember.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { workspaceId: true },
      });
      const workspaceIds = userMemberships.map((m) => m.workspaceId);

      where = {
        id,
        OR: [
          { userId },
          { workspaceId: { in: workspaceIds } },
        ],
      };
    }

    const board = await this.prisma.board.findFirst({
      where,
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                taskMembers: {
                  include: {
                    user: {
                      select: { id: true, name: true, email: true, avatar: true, username: true },
                    },
                  },
                },
                subtasks: { orderBy: { createdAt: 'asc' } },
                comments: { orderBy: { createdAt: 'asc' } },
                activities: { orderBy: { createdAt: 'desc' } },
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }

    return board;
  }

  async create(userId: string, createBoardDto: CreateBoardDto) {
    const board = await this.prisma.board.create({
      data: {
        name: createBoardDto.name,
        userId,
      },
    });

    const defaultColors = ['#49C4E5', '#8471F2', '#67E2AE', '#FF5722', '#E91E63'];

    if (createBoardDto.columns && createBoardDto.columns.length > 0) {
      for (let i = 0; i < createBoardDto.columns.length; i++) {
        const col = createBoardDto.columns[i];
        if (col.name && col.name.trim() !== '') {
          await this.prisma.column.create({
            data: {
              name: col.name.trim(),
              color: col.color || defaultColors[i % defaultColors.length],
              position: i,
              boardId: board.id,
            },
          });
        }
      }
    } else {
      const defaults = [
        { name: 'To Do', color: '#49C4E5', position: 0 },
        { name: 'Doing', color: '#8471F2', position: 1 },
        { name: 'Completed', color: '#67E2AE', position: 2 },
        { name: 'On Hold', color: '#FF5722', position: 3 },
      ];
      for (const d of defaults) {
        await this.prisma.column.create({
          data: {
            name: d.name,
            color: d.color,
            position: d.position,
            boardId: board.id,
          },
        });
      }
    }

    return this.findOne(board.id, userId);
  }

  async update(id: string, userId: string, updateBoardDto: UpdateBoardDto) {
    const existing = await this.findOne(id, userId);

    if (updateBoardDto.name) {
      await this.prisma.board.update({
        where: { id },
        data: { name: updateBoardDto.name },
      });
    }

    if (updateBoardDto.columns) {
      const defaultColors = ['#49C4E5', '#8471F2', '#67E2AE', '#FF5722', '#E91E63'];
      const updatedIds: string[] = [];

      for (let i = 0; i < updateBoardDto.columns.length; i++) {
        const col = updateBoardDto.columns[i];
        if (!col.name || col.name.trim() === '') continue;

        if (col.id) {
          const existingCol = existing.columns.find((c) => c.id === col.id);
          if (existingCol) {
            await this.prisma.column.update({
              where: { id: col.id },
              data: {
                name: col.name.trim(),
                position: i,
                color: col.color || existingCol.color,
              },
            });
            updatedIds.push(col.id);
          }
        } else {
          const newCol = await this.prisma.column.create({
            data: {
              name: col.name.trim(),
              position: i,
              color: col.color || defaultColors[i % defaultColors.length],
              boardId: id,
            },
          });
          updatedIds.push(newCol.id);
        }
      }

      const toDelete = existing.columns.filter((c) => !updatedIds.includes(c.id));
      for (const col of toDelete) {
        await this.prisma.column.delete({
          where: { id: col.id },
        });
      }
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.board.delete({
      where: { id },
    });
  }
}
