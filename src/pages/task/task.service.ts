import { request } from 'umi';
import { TaskDetailRes, UpdateTaskDTO } from '@/dtos/task.dto';

export const updateTask = async (id: number, body: UpdateTaskDTO): Promise<TaskDetailRes> => {
  return request(`/api/tasks/${id}/update`, {
    method: 'PUT',
    data: body,
  });
};


