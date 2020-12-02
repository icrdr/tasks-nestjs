import { request } from 'umi';
import { loginDTO } from '@/dtos/user.dto';

export const login = async (body: loginDTO) => {
  return request('/api/auth/login', {
    method: 'POST',
    data: body,
  });
};
