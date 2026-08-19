import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  UpdateMemberRoleDto,
  InviteMemberDto,
  WorkspaceRole,
} from './dto/workspace.dto';
import * as crypto from 'crypto';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) { }

  async findAllForUser(userId: string) {
    let memberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        workspace: {
          include: {
            members: {
              where: { status: 'ACTIVE' },
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true, username: true },
                },
              },
            },
            projects: true,
            boards: {
              include: {
                columns: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (memberships.length === 0) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const wsName = user?.name ? `${user.name}'s Workspace` : 'My Workspace';
      await this.create(userId, { name: wsName });

      memberships = await this.prisma.workspaceMember.findMany({
        where: { userId, status: 'ACTIVE' },
        include: {
          workspace: {
            include: {
              members: {
                where: { status: 'ACTIVE' },
                include: {
                  user: {
                    select: { id: true, name: true, email: true, avatar: true, username: true },
                  },
                },
              },
              projects: true,
              boards: {
                include: {
                  columns: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    for (const m of memberships) {
      if (!m.workspace.boards || m.workspace.boards.length === 0) {
        const board = await this.prisma.board.create({
          data: {
            name: 'Tasks',
            userId: m.workspace.ownerId,
            workspaceId: m.workspace.id,
          },
        });
        await this.prisma.column.createMany({
          data: [
            { name: 'To Do', color: '#49C4E5', position: 0, boardId: board.id },
            { name: 'Doing', color: '#8471F2', position: 1, boardId: board.id },
            { name: 'Completed', color: '#67E2AE', position: 2, boardId: board.id },
            { name: 'On Hold', color: '#FF5722', position: 3, boardId: board.id },
          ],
        });
      }
    }

    return memberships.map((m) => ({
      ...m.workspace,
      currentUserRole: m.role,
      memberCount: m.workspace.members.length,
    }));
  }

  async findById(workspaceId: string, userId: string) {
    await this.verifyMembership(workspaceId, userId);

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, username: true, title: true },
            },
          },
        },
        projects: true,
        boards: {
          include: {
            columns: {
              include: {
                tasks: {
                  include: {
                    taskMembers: {
                      include: {
                        user: {
                          select: { id: true, name: true, email: true, avatar: true, username: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
    }

    return workspace;
  }

  async create(userId: string, dto: CreateWorkspaceDto) {
    return this.prisma.$transaction(async (tx) => {

      const workspace = await tx.workspace.create({
        data: {
          name: dto.name.trim(),
          description: dto.description || '',
          ownerId: userId,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: WorkspaceRole.OWNER,
          status: 'ACTIVE',
        },
      });

      const board = await tx.board.create({
        data: {
          name: 'Tasks',
          userId,
          workspaceId: workspace.id,
        },
      });

      await tx.column.createMany({
        data: [
          { name: 'To Do', color: '#49C4E5', position: 0, boardId: board.id },
          { name: 'Doing', color: '#8471F2', position: 1, boardId: board.id },
          { name: 'Completed', color: '#67E2AE', position: 2, boardId: board.id },
          { name: 'On Hold', color: '#FF5722', position: 3, boardId: board.id },
        ],
      });

      return workspace;
    });
  }

  async update(workspaceId: string, userId: string, dto: UpdateWorkspaceDto) {
    const requesterMembership = await this.verifyMembership(workspaceId, userId);

    if (
      requesterMembership.role !== WorkspaceRole.OWNER &&
      requesterMembership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException('Only owners and admins can edit workspace details');
    }

    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description.trim() }),
      },
    });
  }

  async remove(workspaceId: string, userId: string) {
    const requesterMembership = await this.verifyMembership(workspaceId, userId);

    if (requesterMembership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only the workspace owner can delete this workspace');
    }

    return this.prisma.$transaction(async (tx) => {

      await tx.task.deleteMany({ where: { workspaceId } });

      await tx.column.deleteMany({
        where: { board: { workspaceId } },
      });

      await tx.board.deleteMany({ where: { workspaceId } });

      await tx.project.deleteMany({ where: { workspaceId } });

      await tx.workspaceInvitation.deleteMany({ where: { workspaceId } });

      await tx.workspaceMember.deleteMany({ where: { workspaceId } });

      return tx.workspace.delete({ where: { id: workspaceId } });
    });
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    newRole: WorkspaceRole,
    requesterId: string,
  ) {
    const requesterMembership = await this.verifyMembership(workspaceId, requesterId);

    if (
      requesterMembership.role !== WorkspaceRole.OWNER &&
      requesterMembership.role !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException('Only owners and admins can change member roles');
    }

    const targetMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership || targetMembership.status !== 'ACTIVE') {
      throw new NotFoundException('Active workspace member not found');
    }

    if (newRole === WorkspaceRole.OWNER) {
      if (requesterMembership.role !== WorkspaceRole.OWNER) {
        throw new ForbiddenException('Only the current workspace owner can transfer ownership');
      }
      await this.prisma.workspace.update({
        where: { id: workspaceId },
        data: { ownerId: targetUserId },
      });
    } else if (targetMembership.role === WorkspaceRole.OWNER) {
      const otherOwners = await this.prisma.workspaceMember.count({
        where: { workspaceId, role: WorkspaceRole.OWNER, status: 'ACTIVE', userId: { not: targetUserId } },
      });
      if (otherOwners === 0) {
        throw new BadRequestException('Cannot demote the only owner. Please promote another member to Owner first.');
      }
    }

    return this.prisma.workspaceMember.update({
      where: { id: targetMembership.id },
      data: { role: newRole },
      include: {
        user: {
          select: { id: true, name: true, email: true, username: true, avatar: true },
        },
      },
    });
  }

  async getMembers(workspaceId: string, userId: string, search?: string) {

    await this.verifyMembership(workspaceId, userId);

    const members = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        status: 'ACTIVE',
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
      orderBy: { createdAt: 'asc' },
    });

    let result = members;
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      result = members.filter(
        (m) =>
          m.user.name?.toLowerCase().includes(q) ||
          m.user.username?.toLowerCase().includes(q) ||
          m.user.email?.toLowerCase().includes(q),
      );
    }

    return result.map((m) => ({
      id: m.id,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      user: m.user,
    }));
  }

  async removeMember(workspaceId: string, targetUserId: string, requesterId: string) {
    const requesterMembership = await this.verifyMembership(workspaceId, requesterId);

    if (
      requesterMembership.role !== WorkspaceRole.OWNER &&
      requesterMembership.role !== WorkspaceRole.ADMIN &&
      requesterId !== targetUserId
    ) {
      throw new ForbiddenException('Insufficient permissions to remove members from this workspace');
    }

    const targetMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
      include: { user: true, workspace: true },
    });

    if (!targetMembership || targetMembership.status !== 'ACTIVE') {
      throw new NotFoundException('Active member not found in this workspace');
    }

    return this.prisma.$transaction(async (tx) => {

      if (targetMembership.role === WorkspaceRole.OWNER) {
        const otherActiveOwners = await tx.workspaceMember.findMany({
          where: {
            workspaceId,
            role: WorkspaceRole.OWNER,
            status: 'ACTIVE',
            userId: { not: targetUserId },
          },
        });

        if (otherActiveOwners.length > 0) {
          await tx.workspace.update({
            where: { id: workspaceId },
            data: { ownerId: otherActiveOwners[0].userId },
          });
        } else {

          const adminSuccessor = await tx.workspaceMember.findFirst({
            where: {
              workspaceId,
              role: WorkspaceRole.ADMIN,
              status: 'ACTIVE',
              userId: { not: targetUserId },
            },
            orderBy: { joinedAt: 'asc' },
            include: { user: true },
          });

          const memberSuccessor = adminSuccessor
            ? null
            : await tx.workspaceMember.findFirst({
              where: {
                workspaceId,
                role: WorkspaceRole.MEMBER,
                status: 'ACTIVE',
                userId: { not: targetUserId },
              },
              orderBy: { joinedAt: 'asc' },
              include: { user: true },
            });

          const successor = adminSuccessor || memberSuccessor;

          if (!successor) {
            throw new BadRequestException(
              'You are the only member in this workspace. To leave, please delete the workspace from the General tab.',
            );
          }

          await tx.workspaceMember.update({
            where: { id: successor.id },
            data: { role: WorkspaceRole.OWNER },
          });

          await tx.workspace.update({
            where: { id: workspaceId },
            data: { ownerId: successor.userId },
          });

          await tx.notification.create({
            data: {
              userId: successor.userId,
              type: 'workspace_invite',
              title: 'Workspace Ownership Transferred',
              message: `${targetMembership.user.name || targetMembership.user.email} left the workspace. You are now the Owner of "${targetMembership.workspace.name}".`,
              link: '',
            },
          });
        }
      }

      const updated = await tx.workspaceMember.update({
        where: { id: targetMembership.id },
        data: { status: 'REMOVED' },
      });

      const workspaceTasks = await tx.task.findMany({
        where: { workspaceId },
        select: { id: true },
      });

      const taskIds = workspaceTasks.map((t) => t.id);
      if (taskIds.length > 0) {
        await tx.taskMember.deleteMany({
          where: {
            taskId: { in: taskIds },
            userId: targetUserId,
          },
        });
      }

      return {
        success: true,
        message: 'Member removed successfully',
        membership: updated,
      };
    });
  }

  async createInvitation(workspaceId: string, requesterId: string, dto: InviteMemberDto) {
    const requesterMembership = await this.verifyMembership(workspaceId, requesterId);

    if (requesterMembership.role === WorkspaceRole.GUEST) {
      throw new ForbiddenException('Guests cannot invite members to the workspace');
    }

    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingMembership = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMembership && existingMembership.status === 'ACTIVE') {
        throw new BadRequestException(`${email} is already an active member of this workspace.`);
      }
    }

    const pendingInvitation = await this.prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email,
        status: 'PENDING',
      },
      include: {
        workspace: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (pendingInvitation) {

      const updated = await this.prisma.workspaceInvitation.update({
        where: { id: pendingInvitation.id },
        data: {
          token,
          role: dto.role || pendingInvitation.role,
          expiresAt,
          invitedById: requesterId,
        },
        include: {
          workspace: { select: { id: true, name: true } },
          invitedBy: { select: { id: true, name: true, email: true } },
        },
      });

      if (existingUser && existingUser.id !== requesterId) {
        await this.prisma.notification.create({
          data: {
            userId: existingUser.id,
            type: 'workspace_invite',
            title: 'Workspace Invitation',
            message: `${updated.invitedBy?.name || updated.invitedBy?.email || 'A team member'} invited you to join "${updated.workspace.name}"`,
            link: `/invite/${updated.token}`,
          },
        });
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        expiresAt: updated.expiresAt,
        workspaceName: updated.workspace.name,
        token: updated.token,
        inviteUrl: `${frontendUrl}/invite/${updated.token}`,
      };
    }

    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email,
        invitedById: requesterId,
        role: dto.role || WorkspaceRole.MEMBER,
        token,
        status: 'PENDING',
        expiresAt,
      },
      include: {
        workspace: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (existingUser && existingUser.id !== requesterId) {
      await this.prisma.notification.create({
        data: {
          userId: existingUser.id,
          type: 'workspace_invite',
          title: 'Workspace Invitation',
          message: `${invitation.invitedBy?.name || invitation.invitedBy?.email || 'A team member'} invited you to join "${invitation.workspace.name}"`,
          link: `/invite/${invitation.token}`,
        },
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      workspaceName: invitation.workspace.name,
      token: invitation.token,
      inviteUrl: `${frontendUrl}/invite/${invitation.token}`,
    };
  }

  async getInvitations(workspaceId: string, requesterId: string) {
    const requesterMembership = await this.verifyMembership(workspaceId, requesterId);

    if (requesterMembership.role === WorkspaceRole.GUEST) {
      throw new ForbiddenException('Guests cannot view workspace invitations');
    }

    return this.prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
        status: 'PENDING',
      },
      include: {
        invitedBy: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvitation(workspaceId: string, invitationId: string, requesterId: string) {
    const requesterMembership = await this.verifyMembership(workspaceId, requesterId);

    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: { id: invitationId, workspaceId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (
      requesterMembership.role !== WorkspaceRole.OWNER &&
      requesterMembership.role !== WorkspaceRole.ADMIN &&
      invitation.invitedById !== requesterId
    ) {
      throw new ForbiddenException('Only owners, admins, or the person who sent the invite can revoke invitations');
    }

    return this.prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    });
  }

  async verifyMembership(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException('You do not belong to this workspace');
    }

    return membership;
  }
}
