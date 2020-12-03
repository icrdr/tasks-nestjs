import { request } from 'umi';
import { GetTasksDTO } from '@/dtos/task.dto';

export async function getTasks(params?: GetTasksDTO) {
  return request('/api/tasks', {
    params,
  });
}
