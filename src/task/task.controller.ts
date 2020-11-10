import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { IsString, IsOptional, IsNumberString } from 'class-validator';
import { TaskService } from './task.service';

class CreateTaskDTO {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string;
}

class GetTasksDTO {
  @IsNumberString()
  @IsOptional()
  perPage: number;

  @IsNumberString()
  @IsOptional()
  page: number;
}

class SubmitRequestDTO {
  @IsString()
  @IsOptional()
  content: string;
}

@Controller('api/tasks')
export class TaskController {
  constructor(private taskService: TaskService) {}
  @Post()
  async createTask(@Body() body: CreateTaskDTO) {
    return this.taskService.createTask({
      name: body.name,
      description: body.description,
    });
  }

  @Get('/:id')
  async getTask(@Param('id') id: number) {
    const task = await this.taskService.getTask(id);
    if (!task) throw new NotFoundException('Task was not found.');
    return task;
  }

  @Get()
  async getTasks(@Query() query: GetTasksDTO) {
    const tasks = await this.taskService.getTasks({
      perPage: query.perPage || 5,
      page: query.page || 0,
    });
    return tasks;
  }

  @Put('/:id/submit')
  async submitRequest(@Param('id') id: number, @Body() body: SubmitRequestDTO) {
    const task = await this.taskService.getTask(id);
    if (!task) throw new NotFoundException('Task was not found.');

    await this.taskService.submitRequest({
      task: id,
      submitter: 1,
      submitContent: body.content,
    });
    return task;
  }
}
