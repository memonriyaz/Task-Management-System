import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('guest')
  @ApiOperation({ summary: 'Create a new guest session with pre-populated demo boards' })
  @ApiResponse({ status: 201, description: 'Guest session created successfully' })
  async createGuest() {
    return this.authService.createGuestSession();
  }

  @Post('login')
  @ApiOperation({ summary: 'Email and password login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() body: { email: string; password?: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('google')
  @ApiOperation({ summary: 'Login or create user session with Google account' })
  @ApiResponse({ status: 201, description: 'Google session authenticated' })
  async loginGoogle(
    @Body() body: { credential?: string; email?: string; name?: string; avatar?: string },
  ) {
    return this.authService.loginWithGoogle(
      body?.email,
      body?.name,
      body?.avatar,
      body?.credential,
    );
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout session' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout() {
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile and workspaces' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async getMe(@Request() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.authService.getMe(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @Request() req: any,
    @Body() body: { name?: string; username?: string; title?: string; avatar?: string },
  ) {
    const userId = req.user.id || req.user.userId;
    return this.authService.updateProfile(userId, body);
  }
}
