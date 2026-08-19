import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, workspaceId?: string) {
    const where: any = { userId };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    return this.prisma.project.findMany({
      where,
      include: {
        tasks: {
          include: {
            subtasks: true,
            comments: true,
            activities: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId?: string) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const project = await this.prisma.project.findFirst({
      where,
      include: {
        tasks: {
          include: {
            subtasks: true,
            comments: true,
            activities: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async create(userId: string, createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: createProjectDto.name.trim(),
        description: createProjectDto.description || '',
        priority: createProjectDto.priority || 'Medium',
        leadName: createProjectDto.leadName || 'Lead',
        leadAvatar:
          createProjectDto.leadAvatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        dueDate: createProjectDto.dueDate || '12 Sep 2026',
        status: createProjectDto.status || 'In Progress',
        userId,
        workspaceId: createProjectDto.workspaceId || undefined,
      },
      include: {
        tasks: true,
      },
    });
  }

  async update(id: string, userId: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id, userId);

    return this.prisma.project.update({
      where: { id },
      data: {
        ...(updateProjectDto.name && { name: updateProjectDto.name.trim() }),
        ...(updateProjectDto.description !== undefined && {
          description: updateProjectDto.description,
        }),
        ...(updateProjectDto.priority && { priority: updateProjectDto.priority }),
        ...(updateProjectDto.leadName && { leadName: updateProjectDto.leadName }),
        ...(updateProjectDto.leadAvatar !== undefined && {
          leadAvatar: updateProjectDto.leadAvatar,
        }),
        ...(updateProjectDto.dueDate && { dueDate: updateProjectDto.dueDate }),
        ...(updateProjectDto.status && { status: updateProjectDto.status }),
      },
      include: {
        tasks: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.project.delete({
      where: { id },
    });
  }
}
