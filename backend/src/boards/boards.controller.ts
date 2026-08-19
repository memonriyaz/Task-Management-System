import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('boards')
@ApiBearerAuth()
@Controller('api/boards')
export class BoardsController {
  constructor(
    private readonly boardsService: BoardsService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private async getUserId(authHeader?: string): Promise<string> {
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = this.jwtService.decode(token) as any;
        if (decoded && decoded.sub) {
          return decoded.sub;
        }
      } catch (e) {

      }
    }

    const firstUser = await this.prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    if (firstUser) {
      return firstUser.id;
    }

    const newUser = await this.prisma.user.create({
      data: { name: 'Demo User', isGuest: true },
    });
    return newUser.id;
  }

  @Get()
  @ApiOperation({ summary: 'Get all boards for current user, optionally filtered by workspace' })
  @ApiResponse({ status: 200, description: 'List of boards' })
  async findAll(
    @Headers('authorization') authHeader?: string,
    @Param('workspaceId') workspaceId?: string,
  ) {
    const userId = await this.getUserId(authHeader);
    return this.boardsService.findAll(userId, workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get board details by ID' })
  @ApiResponse({ status: 200, description: 'Board details' })
  async findOne(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = await this.getUserId(authHeader);
    return this.boardsService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new board' })
  @ApiResponse({ status: 201, description: 'Board created successfully' })
  async create(
    @Body() createBoardDto: CreateBoardDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = await this.getUserId(authHeader);
    return this.boardsService.create(userId, createBoardDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update board by ID' })
  @ApiResponse({ status: 200, description: 'Board updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateBoardDto: UpdateBoardDto,
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = await this.getUserId(authHeader);
    return this.boardsService.update(id, userId, updateBoardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete board by ID' })
  @ApiResponse({ status: 200, description: 'Board deleted successfully' })
  async remove(
    @Param('id') id: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = await this.getUserId(authHeader);
    return this.boardsService.remove(id, userId);
  }
}
