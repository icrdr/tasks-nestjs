import { Controller, Inject } from '@nestjs/common';
import { RoleService } from '../services/role.service';

@Controller('api/roles')
export class RoleController {
  @Inject()
  private roleService: RoleService;
}
