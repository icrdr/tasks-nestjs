import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumberString,
  IsBoolean,
  IsBooleanString,
  IsNumber,
} from 'class-validator';
import { Request, Response } from 'express';
import { Perms } from 'src/user/perm.decorator';
import { PermGuard } from 'src/user/perm.guard';
import { UserService } from '../user/services/user.service';
import { CurrentUser } from '../user/user.decorator';
import { currentUser } from '../user/user.interface';
import { TaskState } from './task.entity';
import { TaskService } from './task.service';

class CreateTaskDTO {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string;
}

class GetTasksDTO {
  @IsNumber()
  @IsOptional()
  perPage: number;

  @IsNumber()
  @IsOptional()
  page: number;
}

class SubmitRequestDTO {
  @IsString()
  @IsOptional()
  content: string;
}

class RespondRequestDTO {
  @IsBooleanString()
  isConfirmed: string;

  @IsString()
  @IsOptional()
  content: string;
}

@Controller('api/tasks')
export class TaskController {
  constructor(
    private taskService: TaskService,
    private userService: UserService,
  ) {}

  @Perms('common.task.create')
  @Post()
  async createTask(
    @Body() body: CreateTaskDTO,
    @CurrentUser() currentUser: currentUser,
  ) {
    return this.taskService.createTask(body.name, [currentUser.id], {
      description: body.description,
    });
  }

  @Perms('common.task.browse')
  @Get('/:id')
  async getTask(@Param('id') id: number) {
    const task = await this.taskService.getTask(id);
    return task;
  }

  @Perms('common.task.browse')
  @Get()
  async getTasks(@Query() query: GetTasksDTO) {
    const tasks = await this.taskService.getTasks({
      perPage: query.perPage || 5,
      page: query.page || 0,
    });
    return tasks;
  }

  @Perms('common.task.start')
  @Put('/:id/start')
  async startTask(
    @Param('id') id: number,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.isUserThePerformer(id, currentUser.id);
    return await this.taskService.startTask(task);
  }

  @Perms('common.task.complete')
  @Put('/:id/complete')
  async completeTask(
    @Param('id') id: number,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.isUserThePerformer(id, currentUser.id);
    return await this.taskService.completeTask(task);
  }

  @Perms('common.task.submitRequest')
  @Put('/:id/submit')
  async submitRequest(
    @Param('id') id: number,
    @Body() body: SubmitRequestDTO,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.isUserThePerformer(id, currentUser.id);
    return await this.taskService.submitRequest(task, currentUser.id, {
      submitContent: body.content,
    });
  }

  @Perms('common.task.respondRequest')
  @Put('/:id/respond')
  async respondRequest(
    @Param('id') id: number,
    @Body() body: RespondRequestDTO,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.isUserThePerformer(id, currentUser.id);
    return await this.taskService.respondRequest(
      task,
      body.isConfirmed === 'true',
      currentUser.id,
      { responseContent: body.content },
    );
  }

  @Perms('common.task.create')
  @Post('/:id')
  async createSubTask(
    @Param('id') id: number,
    @Body() body: CreateTaskDTO,
    @CurrentUser() currentUser: currentUser,
  ) {
    const task = await this.taskService.isUserThePerformer(id, currentUser.id);
    return this.taskService.createSubTask(task, body.name, [currentUser.id], {
      description: body.description,
    });
  }
}
