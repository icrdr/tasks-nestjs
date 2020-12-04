import { request } from 'umi';
import { LoginDTO } from '@/dtos/user.dto';

export const login = async (body: LoginDTO) => {
  return request('/api/auth/login', {
    method: 'POST',
    data: body,
  });
};
