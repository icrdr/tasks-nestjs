import { request, history } from 'umi';


export async function getCurrentUser() {
  return request('/api/currentUser');
}

export async function logout() {
  return request('/api/logout');
}
