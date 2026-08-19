import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async createGuestSession() {
    const guestUser = await this.prisma.user.create({
      data: {
        name: `Guest User`,
        username: `guest`,
        title: 'Product Designer & Engineer',
        isGuest: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      },
    });

    await this.seedFigmaWorkspace(guestUser.id);

    const payload = { sub: guestUser.id, name: guestUser.name, isGuest: true };
    const token = this.jwtService.sign(payload);

    return {
      user: guestUser,
      accessToken: token,
    };
  }

  async login(email: string, password?: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      if (!password || password.trim().length === 0) {
        throw new UnauthorizedException('Password is required to create an account');
      }

      const name = email.split('@')[0].replace(/[._]/g, ' ');
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      const rawPassword = password;
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      user = await this.prisma.user.create({
        data: {
          email,
          name: formattedName || 'User',
          username: email.split('@')[0],
          title: 'Team Member',
          password: hashedPassword,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          isGuest: false,
        },
      });

      await this.createFreshWorkspace(user.id, user.name);
    } else {
      if (!user.password) {
        throw new UnauthorizedException(
          'This account was registered with Google Sign-In. Please click "Continue with Google" to sign in.',
        );
      }

      if (!password || password.trim().length === 0) {
        throw new UnauthorizedException('Password is required');
      }

      const isBcryptMatch = await bcrypt.compare(password, user.password).catch(() => false);
      const isPlaintextMatch = user.password === password;

      if (!isBcryptMatch && !isPlaintextMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }

      if (isPlaintextMatch && !isBcryptMatch) {
        const newHash = await bcrypt.hash(password, 10);
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { password: newHash },
        });
      }
    }

    const payload = { sub: user.id, name: user.name, email: user.email, isGuest: false };
    const token = this.jwtService.sign(payload);

    return {
      user,
      accessToken: token,
    };
  }

  async loginWithGoogle(
    email?: string,
    name?: string,
    avatar?: string,
    credential?: string,
  ) {
    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;

    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.email) {
            userEmail = payload.email;
            userName = payload.name || userName;
            userAvatar = payload.picture || userAvatar;
          }
        }
      } catch (err) {
        console.error('Failed to parse Google credential:', err);
      }
    }

    if (!userEmail) {
      userEmail = `user.google_${Date.now()}@gmail.com`;
    }
    if (!userName) {
      userName = userEmail.split('@')[0];
    }
    if (!userAvatar) {
      userAvatar =
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
    }

    let user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (user && user.password && !credential) {
      throw new UnauthorizedException(
        'This account was registered with a password. Please sign in with your email and password.',
      );
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: userName,
          email: userEmail,
          username: userEmail.split('@')[0],
          title: 'Senior Product Designer',
          avatar: userAvatar,
          isGuest: false,
        },
      });
      await this.createFreshWorkspace(user.id, user.name);
    }

    const payload = { sub: user.id, name: user.name, email: user.email, isGuest: false };
    const token = this.jwtService.sign(payload);

    return {
      user,
      accessToken: token,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        boards: {
          include: {
            columns: {
              include: {
                tasks: true,
              },
            },
          },
        },
        projects: true,
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    data: { name?: string; username?: string; title?: string; avatar?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.username && { username: data.username }),
        ...(data.title && { title: data.title }),
        ...(data.avatar && { avatar: data.avatar }),
      },
    });
  }

  async createFreshWorkspace(primaryUserId: string, userName?: string | null) {
    const wsName = userName && userName !== 'User' ? `${userName}'s Workspace` : 'My Workspace';

    const workspace = await this.prisma.workspace.create({
      data: {
        name: wsName,
        description: 'Personal workspace',
        ownerId: primaryUserId,
        members: {
          create: {
            userId: primaryUserId,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        },
      },
    });

    const board = await this.prisma.board.create({
      data: {
        name: 'Tasks',
        userId: primaryUserId,
        workspaceId: workspace.id,
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

    return workspace;
  }

  async seedFigmaWorkspace(primaryUserId: string) {
    const primaryUser = await this.prisma.user.findUnique({ where: { id: primaryUserId } });
    const ownerName = primaryUser?.name || 'Guest User';
    const ownerAvatar = primaryUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

    let ankit = await this.prisma.user.findUnique({ where: { email: 'ankit@example.com' } });
    if (!ankit) {
      ankit = await this.prisma.user.create({
        data: {
          name: 'Ankit Dutta',
          email: 'ankit@example.com',
          username: 'ankit',
          title: 'Senior Frontend Engineer',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          isGuest: false,
        },
      });
    }

    let cn = await this.prisma.user.findUnique({ where: { email: 'cn@example.com' } });
    if (!cn) {
      cn = await this.prisma.user.create({
        data: {
          name: 'CN',
          email: 'cn@example.com',
          username: 'cn',
          title: 'Full Stack Engineer',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          isGuest: false,
        },
      });
    }

    let john = await this.prisma.user.findUnique({ where: { email: 'john@example.com' } });
    if (!john) {
      john = await this.prisma.user.create({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          username: 'johndoe',
          title: 'Backend Systems Architect',
          avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&auto=format&fit=crop&q=80',
          isGuest: false,
        },
      });
    }

    const wsA = await this.prisma.workspace.create({
      data: {
        name: 'Design Team',
        description: 'Product design, UX research, and UI component systems.',
        ownerId: primaryUserId,
      },
    });

    await this.prisma.workspaceMember.createMany({
      data: [
        { workspaceId: wsA.id, userId: primaryUserId, role: 'OWNER', status: 'ACTIVE' },
        { workspaceId: wsA.id, userId: ankit.id, role: 'MEMBER', status: 'ACTIVE' },
        { workspaceId: wsA.id, userId: cn.id, role: 'MEMBER', status: 'ACTIVE' },
      ],
    });

    const projHomepage = await this.prisma.project.create({
      data: {
        name: 'Design Homepage',
        description: 'Complete UI/UX design and wireframe specs for core website.',
        priority: 'High',
        leadName: ownerName,
        leadAvatar: ownerAvatar,
        dueDate: '12 Sep 2026',
        status: 'In Progress',
        userId: primaryUserId,
        workspaceId: wsA.id,
      },
    });

    const projLogin = await this.prisma.project.create({
      data: {
        name: 'Develop Login Feature',
        description: 'Authentication system with OAuth, session persistence and guest login.',
        priority: 'Low',
        leadName: 'CN',
        leadAvatar: '',
        dueDate: '15 Sep 2026',
        status: 'In Progress',
        userId: primaryUserId,
        workspaceId: wsA.id,
      },
    });

    const boardA = await this.prisma.board.create({
      data: {
        name: 'Tasks',
        userId: primaryUserId,
        workspaceId: wsA.id,
      },
    });

    const colTodoA = await this.prisma.column.create({
      data: { name: 'To Do', color: '#49C4E5', position: 0, boardId: boardA.id },
    });
    const colDoingA = await this.prisma.column.create({
      data: { name: 'Doing', color: '#8471F2', position: 1, boardId: boardA.id },
    });
    const colCompletedA = await this.prisma.column.create({
      data: { name: 'Completed', color: '#67E2AE', position: 2, boardId: boardA.id },
    });
    const colOnHoldA = await this.prisma.column.create({
      data: { name: 'On Hold', color: '#FF5722', position: 3, boardId: boardA.id },
    });

    const t1 = await this.prisma.task.create({
      data: {
        title: 'Write API Documentation',
        description:
          'Create clear and unified API documentation to guide developers in using the inventory and sales metrics endpoints effectively.',
        status: 'To Do',
        priority: 'Urgent',
        dueDate: '29 Jul',
        labels: 'Research, Design, Development, Testing, Deployment',
        assigneeName: ownerName,
        assigneeAvatar: ownerAvatar,
        resources: JSON.stringify([
          { name: 'API Swagger Documentation', url: 'http://localhost:4000/api/docs' },
          { name: 'Figma Workspace Components', url: 'https://figma.com' },
        ]),
        team: 'Engineering',
        reporter: ownerName,
        position: 0,
        columnId: colTodoA.id,
        workspaceId: wsA.id,
      },
    });

    await this.prisma.taskMember.createMany({
      data: [
        { taskId: t1.id, userId: primaryUserId },
        { taskId: t1.id, userId: ankit.id },
      ],
    });

    await this.prisma.subtask.createMany({
      data: [
        {
          title: 'Subtask 1',
          priority: 'High',
          dueDate: '12 Sep 2026',
          assigneeName: ownerName,
          assigneeAvatar: ownerAvatar,
          isCompleted: false,
          taskId: t1.id,
        },
        {
          title: 'Subtask 2',
          priority: 'Low',
          dueDate: '15 Sep 2026',
          assigneeName: 'CN',
          assigneeAvatar: '',
          isCompleted: false,
          taskId: t1.id,
        },
      ],
    });

    await this.prisma.comment.create({
      data: {
        authorName: 'Ankit Dutta',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        content: 'I have started drafting the OpenAPI spec.',
        taskId: t1.id,
      },
    });

    const t2 = await this.prisma.task.create({
      data: {
        title: 'Design Homepage',
        description: 'Pixel-perfect responsive landing page with dark mode support.',
        status: 'To Do',
        priority: 'High',
        dueDate: '12 Sep 2026',
        labels: 'Design, Frontend',
        assigneeName: ownerName,
        assigneeAvatar: ownerAvatar,
        position: 1,
        columnId: colTodoA.id,
        projectId: projHomepage.id,
        workspaceId: wsA.id,
      },
    });
    await this.prisma.taskMember.create({
      data: { taskId: t2.id, userId: primaryUserId },
    });

    const t3 = await this.prisma.task.create({
      data: {
        title: 'Develop Login Feature',
        description: 'Guest authentication and social login authentication modal.',
        status: 'To Do',
        priority: 'Low',
        dueDate: '15 Sep 2026',
        labels: 'Auth',
        assigneeName: 'CN',
        position: 2,
        columnId: colTodoA.id,
        projectId: projLogin.id,
        workspaceId: wsA.id,
      },
    });
    await this.prisma.taskMember.create({
      data: { taskId: t3.id, userId: cn.id },
    });

    const t4 = await this.prisma.task.create({
      data: {
        title: 'Code Review Completed',
        description: 'Review frontend state management and API contract adherence.',
        status: 'Doing',
        priority: 'Medium',
        dueDate: '29 Jul',
        labels: 'Deployment',
        assigneeName: 'Ankit',
        position: 0,
        columnId: colDoingA.id,
        workspaceId: wsA.id,
      },
    });
    await this.prisma.taskMember.create({
      data: { taskId: t4.id, userId: ankit.id },
    });

    const wsB = await this.prisma.workspace.create({
      data: {
        name: 'Engineering Team',
        description: 'Core backend microservices, database migrations, and CI/CD pipelines.',
        ownerId: primaryUserId,
      },
    });

    await this.prisma.workspaceMember.createMany({
      data: [
        { workspaceId: wsB.id, userId: primaryUserId, role: 'OWNER', status: 'ACTIVE' },
        { workspaceId: wsB.id, userId: john.id, role: 'MEMBER', status: 'ACTIVE' },
      ],
    });

    const projAPI = await this.prisma.project.create({
      data: {
        name: 'Build API',
        description: 'NestJS REST API architecture and Swagger specification.',
        priority: 'Urgent',
        leadName: 'John Doe',
        leadAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&auto=format&fit=crop&q=80',
        dueDate: '20 Sep 2026',
        status: 'In Progress',
        userId: primaryUserId,
        workspaceId: wsB.id,
      },
    });

    const boardB = await this.prisma.board.create({
      data: {
        name: 'Tasks',
        userId: primaryUserId,
        workspaceId: wsB.id,
      },
    });

    const colTodoB = await this.prisma.column.create({
      data: { name: 'To Do', color: '#49C4E5', position: 0, boardId: boardB.id },
    });
    const colDoingB = await this.prisma.column.create({
      data: { name: 'Doing', color: '#8471F2', position: 1, boardId: boardB.id },
    });
    const colCompletedB = await this.prisma.column.create({
      data: { name: 'Completed', color: '#67E2AE', position: 2, boardId: boardB.id },
    });
    const colOnHoldB = await this.prisma.column.create({
      data: { name: 'On Hold', color: '#FF5722', position: 3, boardId: boardB.id },
    });

    const tb1 = await this.prisma.task.create({
      data: {
        title: 'Build API',
        description: 'Implement NestJS controllers, services, and Prisma database schema.',
        status: 'To Do',
        priority: 'Urgent',
        dueDate: '20 Sep 2026',
        labels: 'Backend, API',
        assigneeName: 'John',
        position: 0,
        columnId: colTodoB.id,
        projectId: projAPI.id,
        workspaceId: wsB.id,
      },
    });
    await this.prisma.taskMember.createMany({
      data: [
        { taskId: tb1.id, userId: primaryUserId },
        { taskId: tb1.id, userId: john.id },
      ],
    });

    const tb2 = await this.prisma.task.create({
      data: {
        title: 'Fix Authentication',
        description: 'Verify JWT tokens, expiration intervals, and workspace access guard.',
        status: 'Doing',
        priority: 'High',
        dueDate: '25 Sep 2026',
        labels: 'Security',
        assigneeName: 'John',
        position: 0,
        columnId: colDoingB.id,
        workspaceId: wsB.id,
      },
    });
    await this.prisma.taskMember.create({
      data: { taskId: tb2.id, userId: john.id },
    });
  }
}
