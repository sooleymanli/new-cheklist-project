import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @Permissions('location.view')
  findAll(@Query('buildingId') buildingId?: string, @Query('floorId') floorId?: string) {
    return this.locationsService.findAll(buildingId, floorId);
  }

  @Get(':id')
  @Permissions('location.view')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Post()
  @Permissions('location.create')
  create(@Body() dto: CreateLocationDto, @CurrentUser('id') userId: string) {
    return this.locationsService.create(dto, userId);
  }

  @Patch(':id')
  @Permissions('location.update')
  update(@Param('id') id: string, @Body() dto: UpdateLocationDto, @CurrentUser('id') userId: string) {
    return this.locationsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Permissions('location.delete')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.locationsService.remove(id, userId);
  }

  @Patch(':id/activate')
  @Permissions('location.update')
  activate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.locationsService.activate(id, userId);
  }

  @Patch(':id/deactivate')
  @Permissions('location.update')
  deactivate(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.locationsService.deactivate(id, userId);
  }
}
