import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  UpdateMemberRoleDto,
  InviteMemberDto,
} from './dto/workspace.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('workspaces')
@Controller('api/workspaces')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all workspaces for the current user' })
  @ApiResponse({ status: 200, description: 'List of workspaces' })
  async findAll(@Request() req: any) {
    return this.workspacesService.findAllForUser(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  async create(@Request() req: any, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace details by ID' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.workspacesService.findById(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace name or description' })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
    @Request() req: any,
  ) {
    return this.workspacesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workspace (Owner only)' })
  @ApiResponse({ status: 200, description: 'Workspace deleted successfully' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.workspacesService.remove(id, req.user.id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get active members of a workspace with optional search' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of workspace members' })
  async getMembers(
    @Param('id') workspaceId: string,
    @Query('search') search: string,
    @Request() req: any,
  ) {
    return this.workspacesService.getMembers(workspaceId, req.user.id, search);
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'Update member role in workspace' })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  async updateMemberRole(
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Request() req: any,
  ) {
    return this.workspacesService.updateMemberRole(workspaceId, targetUserId, dto.role, req.user.id);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Update member in workspace' })
  @ApiResponse({ status: 200, description: 'Member updated' })
  async updateMember(
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Request() req: any,
  ) {
    return this.workspacesService.updateMemberRole(workspaceId, targetUserId, dto.role, req.user.id);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from a workspace' })
  @ApiResponse({ status: 200, description: 'Member removed from workspace' })
  async removeMember(
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string,
    @Request() req: any,
  ) {
    return this.workspacesService.removeMember(workspaceId, targetUserId, req.user.id);
  }

  @Post(':id/invitations')
  @ApiOperation({ summary: 'Invite a new member to the workspace' })
  @ApiResponse({ status: 201, description: 'Invitation sent' })
  async createInvitation(
    @Param('id') workspaceId: string,
    @Body() dto: InviteMemberDto,
    @Request() req: any,
  ) {
    return this.workspacesService.createInvitation(workspaceId, req.user.id, dto);
  }

  @Get(':id/invitations')
  @ApiOperation({ summary: 'Get pending invitations for a workspace' })
  @ApiResponse({ status: 200, description: 'List of invitations' })
  async getInvitations(@Param('id') workspaceId: string, @Request() req: any) {
    return this.workspacesService.getInvitations(workspaceId, req.user.id);
  }

  @Delete(':id/invitations/:invitationId')
  @ApiOperation({ summary: 'Revoke a pending workspace invitation' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  async revokeInvitation(
    @Param('id') workspaceId: string,
    @Param('invitationId') invitationId: string,
    @Request() req: any,
  ) {
    return this.workspacesService.revokeInvitation(workspaceId, invitationId, req.user.id);
  }
}
