import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto } from './dto';
import { Permissions } from '../../shared/decorators/permissions.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('select')
  @Permissions('role.view')
  @ApiOperation({ summary: 'Get roles for select (id + name only)' })
  findAllSelect() {
    return this.rolesService.findAllSelect();
  }

  @Get()
  @Permissions('role.view')
  @ApiOperation({ summary: 'Get all roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id/permissions')
  @Permissions('role.view')
  @ApiOperation({ summary: 'Get permissions for a role' })
  findPermissions(@Param('id') id: string) {
    return this.rolesService.findPermissions(id);
  }

  @Get(':id')
  @Permissions('role.view')
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @Permissions('role.create')
  @ApiOperation({ summary: 'Create role' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch(':id')
  @Permissions('role.update')
  @ApiOperation({ summary: 'Update role' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('role.delete')
  @ApiOperation({ summary: 'Delete role' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions')
  @Permissions('role.update')
  @ApiOperation({ summary: 'Assign permissions to role' })
  assignPermissions(@Param('id') id: string, @Body() dto: AssignPermissionsDto) {
    return this.rolesService.assignPermissions(id, dto);
  }
}
