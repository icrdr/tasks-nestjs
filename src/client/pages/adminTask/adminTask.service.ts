import { request } from 'umi';
import {
  CreateSubTaskDTO,
  CreateTaskDTO,
  GetTasksDTO,
  RespondRequestDTO,
  SubmitRequestDTO,
  TaskDetailRes,
  TaskListRes,
} from '@dtos/task.dto';
import { UserListRes } from '@dtos/user.dto';

export async function getUsersByfullName(fullName: string): Promise<UserListRes> {
  return request('/api/users', { params: { username: fullName } });
}

export const createTask = async (body: CreateTaskDTO): Promise<TaskDetailRes> => {
  return request('/api/tasks', {
    method: 'POST',
    data: body,
  });
};

export const createSubTask = async (id: number, body: CreateSubTaskDTO): Promise<TaskDetailRes> => {
  return request(`/api/tasks/${id}`, {
    method: 'POST',
    data: body,
  });
};

export async function getTasks(params?: GetTasksDTO): Promise<TaskListRes> {
  return request('/api/tasks', {
    params,
  });
}

export async function getTask(id: number): Promise<TaskDetailRes> {
  return request(`/api/tasks/${id}`);
}

export async function getSubTasks(id: number, params?: GetTasksDTO): Promise<TaskListRes> {
  return request(`/api/tasks/${id}/tasks`, {
    params,
  });
}

export async function changeState(
  id: number,
  action: 'start' | 'suspend' | 'complete' | 'restart',
): Promise<TaskDetailRes> {
  return request(`/api/tasks/${id}/${action}`, { method: 'PUT' });
}

export async function submitRequest(id: number, body: SubmitRequestDTO): Promise<TaskDetailRes> {
  return request(`/api/tasks/${id}/submit`, { method: 'PUT', data: body });
}

export async function respondRequest(id: number, body: RespondRequestDTO): Promise<TaskDetailRes> {
  return request(`/api/tasks/${id}/respond`, { method: 'PUT', data: body });
}
