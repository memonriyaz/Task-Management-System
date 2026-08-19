import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: { orderBy: { createdAt: 'asc' } },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            replies: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        activities: { orderBy: { createdAt: 'desc' } },
        column: true,
        project: true,
        workspace: true,
        taskMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                avatar: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async create(createTaskDto: CreateTaskDto, requesterId?: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: createTaskDto.columnId },
      include: {
        board: true,
        tasks: true,
      },
    });

    if (!column) {
      throw new NotFoundException(
        `Column with ID ${createTaskDto.columnId} not found`,
      );
    }

    let workspaceId = createTaskDto.workspaceId;
    if (!workspaceId && column.board.workspaceId) {
      workspaceId = column.board.workspaceId;
    }

    if (createTaskDto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: createTaskDto.projectId },
      });
      if (project) {
        if (!workspaceId && project.workspaceId) {
          workspaceId = project.workspaceId;
        } else if (workspaceId && project.workspaceId && workspaceId !== project.workspaceId) {
          throw new BadRequestException('Project does not belong to the specified workspace');
        }
      }
    }

    if (createTaskDto.memberIds && createTaskDto.memberIds.length > 0 && workspaceId) {
      const validMembers = await this.prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          userId: { in: createTaskDto.memberIds },
          status: 'ACTIVE',
        },
      });

      if (validMembers.length !== createTaskDto.memberIds.length) {
        throw new ForbiddenException(
          'One or more assigned users are not active members of this workspace',
        );
      }
    }

    const position =
      createTaskDto.position !== undefined
        ? createTaskDto.position
        : column.tasks.length;

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: createTaskDto.title.trim(),
          description: createTaskDto.description || '',
          status: createTaskDto.status || column.name,
          priority: createTaskDto.priority || 'Medium',
          dueDate: createTaskDto.dueDate || '29 Jul',
          labels: createTaskDto.labels || 'Deployment',
          assigneeName: createTaskDto.assigneeName || '',
          assigneeAvatar: createTaskDto.assigneeAvatar || '',
          resources: createTaskDto.resources || JSON.stringify([]),
          team: createTaskDto.team || '',
          reporter: createTaskDto.reporter || '',
          projectId: createTaskDto.projectId || null,
          workspaceId: workspaceId || null,
          position,
          columnId: createTaskDto.columnId,
        },
      });

      if (createTaskDto.memberIds && createTaskDto.memberIds.length > 0) {
        for (const uId of createTaskDto.memberIds) {
          await tx.taskMember.create({
            data: {
              taskId: task.id,
              userId: uId,
            },
          });
        }
      }

      if (createTaskDto.subtasks && createTaskDto.subtasks.length > 0) {
        for (const st of createTaskDto.subtasks) {
          if (st.title && st.title.trim() !== '') {
            await tx.subtask.create({
              data: {
                title: st.title.trim(),
                priority: st.priority || 'Medium',
                dueDate: st.dueDate || '12 Sep 2026',
                assigneeName: st.assigneeName || '',
                assigneeAvatar: st.assigneeAvatar || '',
                isCompleted: st.isCompleted || false,
                taskId: task.id,
              },
            });
          }
        }
      }

      await tx.activity.create({
        data: {
          type: 'create',
          description: `Task "${task.title}" created`,
          taskId: task.id,
        },
      });

      return task;
    }).then((task) => this.findOne(task.id));
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    const existing = await this.findOne(id);

    const updateData: any = {};
    if (updateTaskDto.title !== undefined) {
      updateData.title = updateTaskDto.title.trim();
    }
    if (updateTaskDto.description !== undefined) {
      updateData.description = updateTaskDto.description;
    }
    if (updateTaskDto.columnId !== undefined) {
      updateData.columnId = updateTaskDto.columnId;
    }
    if (updateTaskDto.projectId !== undefined) {
      updateData.projectId = updateTaskDto.projectId;
    }
    if (updateTaskDto.workspaceId !== undefined) {
      updateData.workspaceId = updateTaskDto.workspaceId;
    }
    if (updateTaskDto.status !== undefined) {
      updateData.status = updateTaskDto.status;
      if (existing.status !== updateTaskDto.status) {
        await this.prisma.activity.create({
          data: {
            type: 'status',
            description: `You moved task to ${updateTaskDto.status}`,
            taskId: id,
          },
        });
      }
    }
    if (updateTaskDto.priority !== undefined) {
      updateData.priority = updateTaskDto.priority;
      if (existing.priority !== updateTaskDto.priority) {
        await this.prisma.activity.create({
          data: {
            type: 'priority',
            description: `You changed priority from ${existing.priority || 'No priority'} to ${updateTaskDto.priority}`,
            taskId: id,
          },
        });
      }
    }
    if (updateTaskDto.dueDate !== undefined) {
      updateData.dueDate = updateTaskDto.dueDate;
      if (existing.dueDate !== updateTaskDto.dueDate) {
        await this.prisma.activity.create({
          data: {
            type: 'date',
            description: `You changed due date to ${updateTaskDto.dueDate}`,
            taskId: id,
          },
        });
      }
    }
    if (updateTaskDto.labels !== undefined) {
      updateData.labels = updateTaskDto.labels;
    }
    if (updateTaskDto.assigneeName !== undefined) {
      updateData.assigneeName = updateTaskDto.assigneeName;
      if (existing.assigneeName !== updateTaskDto.assigneeName) {
        await this.prisma.activity.create({
          data: {
            type: 'member',
            description: `You assigned task to ${updateTaskDto.assigneeName || 'Unassigned'}`,
            taskId: id,
          },
        });
      }
    }
    if (updateTaskDto.assigneeAvatar !== undefined) {
      updateData.assigneeAvatar = updateTaskDto.assigneeAvatar;
    }
    if (updateTaskDto.resources !== undefined) {
      updateData.resources = updateTaskDto.resources;
      await this.prisma.activity.create({
        data: {
          type: 'resource',
          description: `You updated task resources`,
          taskId: id,
        },
      });
    }
    if (updateTaskDto.team !== undefined) {
      updateData.team = updateTaskDto.team;
    }
    if (updateTaskDto.reporter !== undefined) {
      updateData.reporter = updateTaskDto.reporter;
    }
    if (updateTaskDto.isLocked !== undefined) {
      updateData.isLocked = updateTaskDto.isLocked;
    }
    if (updateTaskDto.position !== undefined) {
      updateData.position = updateTaskDto.position;
    }

    await this.prisma.task.update({
      where: { id },
      data: updateData,
    });

    if (updateTaskDto.subtasks) {
      for (const st of updateTaskDto.subtasks) {
        if (st.id) {
          const updateSubData: any = {};
          if (st.title !== undefined) updateSubData.title = st.title;
          if (st.priority !== undefined) updateSubData.priority = st.priority;
          if (st.dueDate !== undefined) updateSubData.dueDate = st.dueDate;
          if (st.assigneeName !== undefined) updateSubData.assigneeName = st.assigneeName;
          if (st.assigneeAvatar !== undefined) updateSubData.assigneeAvatar = st.assigneeAvatar;
          if (st.isCompleted !== undefined) updateSubData.isCompleted = st.isCompleted;

          await this.prisma.subtask.update({
            where: { id: st.id },
            data: updateSubData,
          });
        } else if (st.title && st.title.trim() !== '') {
          await this.prisma.subtask.create({
            data: {
              title: st.title.trim(),
              priority: st.priority || 'Medium',
              dueDate: st.dueDate || '12 Sep 2026',
              assigneeName: st.assigneeName || '',
              assigneeAvatar: st.assigneeAvatar || '',
              isCompleted: st.isCompleted || false,
              taskId: id,
            },
          });
        }
      }
    }

    return this.findOne(id);
  }

  async move(id: string, moveTaskDto: MoveTaskDto) {
    const task = await this.findOne(id);
    const targetColumn = await this.prisma.column.findUnique({
      where: { id: moveTaskDto.targetColumnId },
      include: { tasks: { orderBy: { position: 'asc' } } },
    });

    if (!targetColumn) {
      throw new NotFoundException(
        `Destination Column with ID ${moveTaskDto.targetColumnId} not found`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const isColumnChanged = task.columnId !== moveTaskDto.targetColumnId;

      await tx.task.update({
        where: { id },
        data: {
          columnId: moveTaskDto.targetColumnId,
          position: moveTaskDto.targetPosition,
          status: targetColumn.name,
        },
      });

      if (isColumnChanged) {
        await tx.activity.create({
          data: {
            type: 'status',
            description: `You moved task to ${targetColumn.name}`,
            taskId: id,
          },
        });
      }

      return tx.task.findUnique({
        where: { id },
        include: {
          subtasks: true,
          comments: true,
          activities: true,
          taskMembers: { include: { user: true } },
          column: true,
        },
      });
    });
  }

  async addComment(
    id: string,
    authorName?: string,
    content?: string,
    authorAvatar?: string,
    parentId?: string,
  ) {
    if (!content || content.trim() === '') {
      throw new BadRequestException('Comment content cannot be empty');
    }

    const task = await this.findOne(id);

    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment || parentComment.taskId !== id) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        authorName: authorName || 'You',
        authorAvatar:
          authorAvatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        content: content.trim(),
        taskId: id,
        parentId: parentId || null,
      },
      include: {
        replies: true,
      },
    });

    await this.prisma.activity.create({
      data: {
        type: 'comment',
        description: parentId
          ? `${authorName || 'You'} replied to a comment`
          : `${authorName || 'You'} commented on task`,
        taskId: id,
      },
    });

    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({ where: { id: parentId } });
      if (parentComment?.authorName && parentComment.authorName !== authorName) {
        const targetUser = await this.prisma.user.findFirst({
          where: {
            OR: [
              { name: parentComment.authorName },
              { username: parentComment.authorName },
            ],
          },
        });
        if (targetUser) {
          await this.prisma.notification.create({
            data: {
              userId: targetUser.id,
              type: 'comment_reply',
              title: 'New Reply',
              message: `${authorName || 'Someone'} replied: "${content.slice(0, 60)}"`,
              link: id,
            },
          });
        }
      }
    }

    return comment;
  }

  async updateComment(taskId: string, commentId: string, content: string) {
    if (!content || content.trim() === '') {
      throw new BadRequestException('Comment content cannot be empty');
    }
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.taskId !== taskId) {
      throw new NotFoundException('Comment not found');
    }
    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: { replies: true },
    });
  }

  async deleteComment(taskId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.taskId !== taskId) {
      throw new NotFoundException('Comment not found');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { success: true, message: 'Comment deleted successfully' };
  }

  async getTaskMembers(taskId: string) {
    const task = await this.findOne(taskId);
    return task.taskMembers.map((tm) => tm.user);
  }

  async assignMember(taskId: string, targetUserId: string, requesterId?: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        column: { include: { board: true } },
        taskMembers: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const workspaceId = task.workspaceId || task.column.board.workspaceId;

    if (!workspaceId) {
      throw new BadRequestException('Task does not belong to any workspace');
    }

    const workspaceMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
      include: { user: true },
    });

    if (!workspaceMembership || workspaceMembership.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'User is not an active member of this workspace',
      );
    }

    const alreadyAssigned = task.taskMembers.some((tm) => tm.userId === targetUserId);
    if (alreadyAssigned) {
      throw new BadRequestException('User is already assigned to this task');
    }

    let requesterName = 'You';
    if (requesterId) {
      const reqUser = await this.prisma.user.findUnique({ where: { id: requesterId } });
      if (reqUser?.name) requesterName = reqUser.name;
    }

    return this.prisma.$transaction(async (tx) => {

      const taskMember = await tx.taskMember.create({
        data: {
          taskId,
          userId: targetUserId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              avatar: true,
              title: true,
            },
          },
        },
      });

      if (!task.assigneeName || task.assigneeName === 'Unassigned' || task.assigneeName === '') {
        await tx.task.update({
          where: { id: taskId },
          data: {
            assigneeName: workspaceMembership.user.name || workspaceMembership.user.username || 'Member',
            assigneeAvatar: workspaceMembership.user.avatar || '',
          },
        });
      }

      await tx.activity.create({
        data: {
          type: 'member',
          description: `${requesterName} assigned ${workspaceMembership.user.name || 'Member'} to this task`,
          taskId,
        },
      });

      if (targetUserId !== requesterId) {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            type: 'task_assigned',
            title: 'Assigned to Task',
            message: `${requesterName} assigned you to "${task.title}"`,
            link: taskId,
          },
        });
      }

      return taskMember.user;
    });
  }

  async removeMember(taskId: string, targetUserId: string, requesterId?: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { taskMembers: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const existingAssignment = await this.prisma.taskMember.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId: targetUserId,
        },
      },
      include: { user: true },
    });

    if (!existingAssignment) {
      throw new NotFoundException('User is not assigned to this task');
    }

    let requesterName = 'You';
    if (requesterId) {
      const reqUser = await this.prisma.user.findUnique({ where: { id: requesterId } });
      if (reqUser?.name) requesterName = reqUser.name;
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.taskMember.delete({
        where: {
          taskId_userId: {
            taskId,
            userId: targetUserId,
          },
        },
      });

      const remainingMembers = task.taskMembers.filter((tm) => tm.userId !== targetUserId);
      if (remainingMembers.length > 0) {
        const nextUser = await tx.user.findUnique({ where: { id: remainingMembers[0].userId } });
        await tx.task.update({
          where: { id: taskId },
          data: {
            assigneeName: nextUser?.name || nextUser?.username || '',
            assigneeAvatar: nextUser?.avatar || '',
          },
        });
      } else {
        await tx.task.update({
          where: { id: taskId },
          data: {
            assigneeName: '',
            assigneeAvatar: '',
          },
        });
      }

      await tx.activity.create({
        data: {
          type: 'member',
          description: `${requesterName} removed ${existingAssignment.user.name || 'Member'} from this task`,
          taskId,
        },
      });

      return { success: true, message: 'Member removed from task' };
    });
  }

  async remove(id: string) {
    const task = await this.findOne(id);
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
