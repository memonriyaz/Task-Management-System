import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('invitations')
@Controller('api/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Get safe public invitation information by token' })
  @ApiResponse({ status: 200, description: 'Invitation details' })
  async getInvitation(@Param('token') token: string) {
    return this.invitationsService.getInvitationInfo(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a workspace invitation' })
  @ApiResponse({ status: 200, description: 'Joined workspace successfully' })
  async acceptInvitation(@Param('token') token: string, @Request() req: any) {
    return this.invitationsService.acceptInvitation(token, req.user.id);
  }
}
