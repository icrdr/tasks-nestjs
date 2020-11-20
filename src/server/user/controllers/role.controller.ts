import { Controller, Inject } from '@nestjs/common';
import { RoleService } from '../services/role.service';

@Controller('api/roles')
export class RoleController {
  constructor(private roleService: RoleService) {}
}
