import { request } from 'umi';
import { CurrentUserTokenRes, LoginDTO } from '@/dtos/user.dto';

export const login = async (body: LoginDTO): Promise<CurrentUserTokenRes> => {
  return request('/api/auth/login', {
    method: 'POST',
    data: body,
  });
};
