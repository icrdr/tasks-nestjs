import { request } from 'umi';

export interface loginParams {
  username: string;
  password: string;
}

export async function login(params: loginParams) {
  return request('/api/login', {
    method: 'POST',
    data: params,
  });
}
