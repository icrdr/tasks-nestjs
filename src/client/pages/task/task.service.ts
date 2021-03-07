import { request } from 'umi';
import {
  AssetListRes,
  AssetRes,
  CommentListRes,
  AddAssetDTO,
  AddTaskDTO,
  GetAssetsDTO,
  GetCommentsDTO,
  GetTasksDTO,
  TaskDetailRes,
  TaskListRes,
  TaskMoreDetailRes,
  ChangeTaskDTO,
} from '@dtos/task.dto';
import { GetUsersDTO, UserListRes, UserRes } from '@dtos/user.dto';
import { AddAssignmentDTO, AssignmentListRes, AssignmentRes, GetAssignmentDTO } from '@dtos/space.dto';
import { ListDTO } from '@dtos/misc.dto';

export async function getUsers(params: GetUsersDTO): Promise<UserListRes> {
  return request('/api/users', { params });
}

export async function getUser(id: number): Promise<UserRes> {
  return request(`/api/users/${id}`);
}

export const addSpaceTask = async (id: number, body: AddTaskDTO): Promise<TaskDetailRes> => {
  return request(`/api/spaces/${id}/tasks`, {
    method: 'POST',
    data: body,
  });
};

export const addSubTask = async (id: number, body: AddTaskDTO): Promise<TaskDetailRes> => {
  return request(`/api/tasks/${id}`, {
    method: 'POST',
    data: body,
  });
};

export const addTaskAsset = async (id: number, body: AddAssetDTO): Promise<AssetRes> => {
  return request(`/api/tasks/${id}/assets`, {
    method: 'POST',
    data: body,
  });
};

export const removeTaskAsset = async (id: number, assetId: number) => {
  return request(`/api/tasks/${id}/assets/${assetId}`, {
    method: 'DELETE',
  });
};

export const removeSpaceAsset = async (id: number, assetId: number) => {
  return request(`/api/spaces/${id}/assets/${assetId}`, {
    method: 'DELETE',
  });
};

export const removeTaskAssignment = async (id: number, assignmentId: number) => {
  return request(`/api/tasks/${id}/assignments/${assignmentId}`, {
    method: 'DELETE',
  });
};

export const addTaskAssignment = async (
  id: number,
  body: AddAssignmentDTO,
): Promise<AssignmentRes> => {
  return request(`/api/tasks/${id}/assignments`, {
    method: 'POST',
    data: body,
  });
};

export const changeTask = async (id: number, body: ChangeTaskDTO): Promise<TaskDetailRes> => {
  return request(`/api/tasks/${id}`, {
    method: 'PUT',
    data: body,
  });
};

export const removeTask = async (id: number) => {
  return request(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
};

export const addSpaceAsset = async (id: number, body: AddAssetDTO): Promise<AssetRes> => {
  return request(`/api/spaces/${id}/assets`, {
    method: 'POST',
    data: body,
  });
};

export const getTaskAssets = async (id: number, params?: GetAssetsDTO): Promise<AssetListRes> => {
  return request(`/api/tasks/${id}/assets`, {
    params,
  });
};

export const getSpaceAssets = async (id: number, params?: GetAssetsDTO): Promise<AssetListRes> => {
  return request(`/api/spaces/${id}/assets`, {
    params,
  });
};

export const getSpaceGroups = async (id: number, params?: GetAssignmentDTO): Promise<AssignmentListRes> => {
  return request(`/api/spaces/${id}/groups`, {
    params,
  });
};

export const getTaskComments = async (
  id: number,
  params?: GetCommentsDTO,
): Promise<CommentListRes> => {
  return request(`/api/tasks/${id}/comments`, {
    params,
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

export async function changeTaskState(
  id: number,
  action: 'start' | 'suspend' | 'complete' | 'restart' | 'commit' | 'refuse',
): Promise<TaskDetailRes> {
  return request(`/api/tasks/${id}/${action}`, { method: 'PUT' });
}
