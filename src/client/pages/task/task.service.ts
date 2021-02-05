import { request } from 'umi';
import {
  CreateTaskDTO,
  GetTasksDTO,
  ReviewTaskDTO,
  TaskDetailRes,
  TaskListRes,
  TaskMoreDetailRes,
  UpdateTaskDTO,
} from '@dtos/task.dto';
import { UserListRes } from '@dtos/user.dto';

export async function getUsersByfullName(fullName: string): Promise<UserListRes> {
  return request('/api/users', { params: { username: fullName } });
}

export const createSpaceTask = async (id: number, body: CreateTaskDTO): Promise<TaskDetailRes> => {
  return request(`/api/spaces/${id}/tasks`, {
    method: 'POST',
    data: body,
  });
};

export const createSubTask = async (id: number, body: CreateTaskDTO): Promise<TaskDetailRes> => {
  return request(`/api/tasks/${id}`, {
    method: 'POST',
    data: body,
  });
};

export async function getSpaceTasks(id: number, params?: GetTasksDTO): Promise<TaskListRes> {
  return request(`/api/spaces/${id}/tasks`, {
    params,
  });
}

export async function getTask(id: number): Promise<TaskMoreDetailRes> {
  return request(`/api/tasks/${id}`);
}

export async function getSubTasks(id: number, params?: GetTasksDTO): Promise<TaskListRes> {
  return request(`/api/tasks/${id}/tasks`, {
    params,
  });
}

export async function changeState(
  id: number,
  action: 'start' | 'suspend' | 'complete' | 'restart' | 'commit' | 'refuse',
): Promise<TaskDetailRes> {
  return request(`/api/tasks/${id}/${action}`, { method: 'PUT' });
}

export const updateTask = async (id: number, body: UpdateTaskDTO): Promise<TaskDetailRes> => {
  return request(`/api/tasks/${id}/update`, {
    method: 'PUT',
    data: body,
  });
};


