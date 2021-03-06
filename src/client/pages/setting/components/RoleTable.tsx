import React, { useState } from "react";
import { useModel, useRequest } from "umi";
import { Select, Table, Typography } from "antd";
import { RoleRes } from "@dtos/space.dto";
import { changeRole, getSpaceRoles } from "../setting.service";
import { useForm } from "antd/es/form/Form";
const { Text } = Typography;

const RoleTable: React.FC<{ update?: boolean }> = (update) => {
  const { initialState, setInitialState } = useModel("@@initialState");
  const { currentUser, currentSpace } = initialState;
  const [roleList, setRoleList] = useState<RoleRes[]>([]);

  const getSpaceRolesReq = useRequest(() => getSpaceRoles(currentSpace.id), {
    refreshDeps: [update],
    onSuccess: (res) => {
      setRoleList(res.list);
    },
  });

  const changeRoleReq = useRequest(changeRole, {
    manual: true,
    onSuccess: (res) => {
      const _roleList = [...roleList];
      _roleList.forEach((role, index) => {
        if (role.id === res.id) _roleList[index] = res;
      });
      setRoleList(_roleList);
      currentSpace.roles = _roleList;
      setInitialState({ ...initialState, currentSpace });
    },
  });

  const columns = [
    {
      title: "角色名",
      dataIndex: "name",
      key: "name",
      render: (_, role) => {
        return (
          <Text
            editable={{
              onChange: (v) => {
                if (v) changeRoleReq.run(currentSpace.id, role.id, { name: v });
              },
            }}
          >
            {role.name}
          </Text>
        );
      },
    },
    {
      title: "权限",
      dataIndex: "access",
      key: "access",
      render: (_, role) => {
        return (
          <Select
            disabled={roleList.map((r) => r.id).indexOf(role.id) === 0}
            defaultValue={role.access}
            onChange={(v) =>
              changeRoleReq.run(currentSpace.id, role.id, { access: v })
            }
          >
            <Select.Option value="full">完全</Select.Option>
            <Select.Option value="edit">编辑</Select.Option>
            <Select.Option value="view">浏览</Select.Option>
            <Select.Option value={null}>无</Select.Option>
          </Select>
        );
      },
    },
  ];

  return (
    <Table
      pagination={false}
      rowKey={(e) => e.id}
      columns={columns}
      loading={getSpaceRolesReq.loading}
      dataSource={roleList}
    />
  );
};
export default RoleTable;
