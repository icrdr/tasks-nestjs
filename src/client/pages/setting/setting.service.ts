import { request } from "umi";
import {
  AddRoleDTO,
  ChangeRoleDTO,
  GetRolesDTO,
  RoleListRes,
  RoleRes,
} from "@dtos/space.dto";

export const getSpaceRoles = async (
  id: number,
  params?: GetRolesDTO
): Promise<RoleListRes> => {
  return request(`/api/spaces/${id}/roles`, {
    params,
  });
};

export const changeRole = async (
  id: number,
  roleId: number,
  body: ChangeRoleDTO
): Promise<RoleRes> => {
  return request(`/api/spaces/${id}/roles/${roleId}`, {
    method: "PUT",
    data: body,
  });
};

export const addSpaceRole = async (
  id: number,
  body: AddRoleDTO
): Promise<RoleRes> => {
  return request(`/api/spaces/${id}/roles`, {
    method: "POST",
    data: body,
  });
};
