import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  async getInvitationInfo(token: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: { select: { id: true, name: true, description: true, ownerId: true } },
        invitedBy: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or invalid link');
    }

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      workspace: invitation.workspace,
      invitedBy: invitation.invitedBy,
      isExpired: new Date() > invitation.expiresAt,
    };
  }

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found. Please log in first.');
    }

    const existingMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
        },
      },
    });

    if (existingMembership && existingMembership.status === 'ACTIVE') {

      return {
        message: `You are already an active member of ${invitation.workspace.name}`,
        workspaceId: invitation.workspaceId,
        membership: existingMembership,
        isExistingMember: true,
      };
    }

    const normalizedUserEmail = (user.email || '').trim().toLowerCase();
    const normalizedInviteEmail = (invitation.email || '').trim().toLowerCase();

    if (normalizedInviteEmail && normalizedUserEmail && normalizedUserEmail !== normalizedInviteEmail) {
      throw new ForbiddenException(
        `This invitation was created specifically for "${invitation.email}". You are currently signed in as "${user.email}". Please switch accounts or sign in with "${invitation.email}" to accept.`
      );
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(`This invitation has already been ${invitation.status.toLowerCase()}.`);
    }

    if (new Date() > invitation.expiresAt) {
      await this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('This invitation link has expired.');
    }

    return this.prisma.$transaction(async (tx) => {

      const membership = await tx.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: invitation.workspaceId,
            userId: user.id,
          },
        },
        create: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
          role: invitation.role,
          status: 'ACTIVE',
        },
        update: {
          role: invitation.role,
          status: 'ACTIVE',
        },
      });

      await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      if (invitation.invitedById && invitation.invitedById !== user.id) {
        await tx.notification.create({
          data: {
            userId: invitation.invitedById,
            type: 'workspace_invite',
            title: 'Invitation Accepted',
            message: `${user.name || user.username || user.email} accepted your invitation to "${invitation.workspace.name}"`,
            link: '',
          },
        });
      }

      return {
        message: `Successfully joined ${invitation.workspace.name}`,
        workspaceId: invitation.workspaceId,
        membership,
        isExistingMember: false,
      };
    });
  }
}
