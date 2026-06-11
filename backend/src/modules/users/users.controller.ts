import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('user.view')
  @ApiOperation({ summary: 'Get all users (paginated)' })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Permissions('user.view')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Permissions('user.create')
  @ApiOperation({ summary: 'Create user' })
  create(@Body() dto: CreateUserDto, @CurrentUser('id') userId: string) {
    return this.usersService.create(dto, userId);
  }

  @Patch(':id')
  @Permissions('user.update')
  @ApiOperation({ summary: 'Update user' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions('user.delete')
  @ApiOperation({ summary: 'Soft delete user' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.usersService.remove(id, userId);
  }

  @Patch(':id/activate')
  @Permissions('user.update')
  @ApiOperation({ summary: 'Activate user' })
  activate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.usersService.activate(id, userId);
  }

  @Patch(':id/deactivate')
  @Permissions('user.update')
  @ApiOperation({ summary: 'Deactivate user' })
  deactivate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.usersService.deactivate(id, userId);
  }
}
