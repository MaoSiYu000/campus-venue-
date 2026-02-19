import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../guards/roles.guard';
import { RoleType } from '../auth.service';

export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);
