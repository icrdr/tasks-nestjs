import { request } from 'umi';
import { GetUsersDTO } from '@dtos/user.dto';
import { MemberListRes, MemberRes } from '@dtos/space.dto';

export async function getSpaceMembers(id: number, params?: GetUsersDTO): Promise<MemberListRes> {
  return request(`/api/spaces/${id}/members`, {
    params,
  });
}

export async function addSpaceMember(id: number, userId: number): Promise<MemberRes> {
  return request(`/api/spaces/${id}/members/${userId}`, {
    method: 'POST',
  });
}
