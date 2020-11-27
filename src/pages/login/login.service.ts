import { request } from 'umi';
import { loginDTO } from '@/modules/user/controllers/auth.controller';

export const login = async (body: loginDTO) => {
  return request('/api/auth/login', {
    method: 'POST',
    data: body,
  });
};
