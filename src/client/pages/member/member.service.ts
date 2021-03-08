import { request } from 'umi';
import { GetMembersDTO, MemberListRes, MemberRes } from '@dtos/member.dto';
import { AddAssignmentDTO, AssignmentRes, ChangeAssignmentDTO } from '@dtos/assignment.dto';

export async function getSpaceMembers(id: number, params?: GetMembersDTO): Promise<MemberListRes> {
  return request(`/api/spaces/${id}/members`, {
    params,
  });
}

export async function addSpaceMember(id: number, userId: number): Promise<MemberRes> {
  return request(`/api/spaces/${id}/members/${userId}`, {
    method: 'POST',
  });
}

export async function changeSpaceGroup(
  id: number,
  groupId: number,
  body: ChangeAssignmentDTO,
): Promise<AssignmentRes> {
  return request(`/api/spaces/${id}/groups/${groupId}`, {
    method: 'PUT',
    data: body,
  });
}

export async function addSpaceGroupMember(
  id: number,
  groupId: number,
  userId: number,
): Promise<AssignmentRes> {
  return request(`/api/spaces/${id}/groups/${groupId}/members/${userId}`, {
    method: 'POST',
  });
}

export async function removeSpaceMember(id: number, userId: number): Promise<AssignmentRes> {
  return request(`/api/spaces/${id}/members/${userId}`, {
    method: 'DELETE',
  });
}

export async function removeSpaceGroupMember(
  id: number,
  groupId: number,
  userId: number,
): Promise<AssignmentRes> {
  return request(`/api/spaces/${id}/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
  });
}

export async function removeSpaceGroup(id: number, groupId: number) {
  return request(`/api/spaces/${id}/groups/${groupId}`, {
    method: 'DELETE',
  });
}

export async function addSpaceGroup(id: number, body: AddAssignmentDTO): Promise<AssignmentRes> {
  return request(`/api/spaces/${id}/groups/`, {
    method: 'POST',
    data: body,
  });
}
