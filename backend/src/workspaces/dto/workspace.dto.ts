import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsEmail } from 'class-validator';

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Design Team' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Workspace for design and UX engineering' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class InviteMemberDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: WorkspaceRole, default: WorkspaceRole.MEMBER })
  @IsOptional()
  @IsEnum(WorkspaceRole)
  role?: WorkspaceRole;
}

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ example: 'Engineering & Product Team' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated workspace description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: WorkspaceRole })
  @IsNotEmpty()
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}
