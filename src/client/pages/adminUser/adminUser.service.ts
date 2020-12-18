import { request } from 'umi';
import { GetUsersDTO } from '@dtos/user.dto';

export async function getUsers(params?: GetUsersDTO) {
  return request('/api/users', {
    params,
  });
}
