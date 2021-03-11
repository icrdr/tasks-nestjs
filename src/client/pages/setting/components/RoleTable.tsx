import React, { useState } from 'react';
import { useModel, useRequest } from 'umi';
import { Button, Dropdown, Menu, Popconfirm, Select, Table, Typography } from 'antd';
import { changeSpaceRole, getSpaceRoles, removeSpaceRole } from '../setting.service';
import { useForm } from 'antd/es/form/Form';
import { EllipsisOutlined } from '@ant-design/icons';
import { getSpace } from '../../layout/layout.service';
import { RoleRes } from '@dtos/role.dto';
const { Text } = Typography;

const RoleTable: React.FC<{ list: RoleRes[]; update?: boolean }> = ({ list, update = false }) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const { currentUser, currentSpace } = initialState;
  // const [roleList, setRoleList] = useState<RoleRes[]>([]);
  // const [dataUpdate, setDataUpdate] = useState(false);

  // const getSpaceRolesReq = useRequest(() => getSpaceRoles(currentSpace.id), {
  //   refreshDeps: [update, dataUpdate],
  //   onSuccess: (res) => {
  //     setRoleList(res.list);
  //   },
  // });

  const removeSpaceRoleReq = useRequest(removeSpaceRole, {
    manual: true,
    onSuccess: async () => {
      const res = await getSpace(currentSpace.id);
      setInitialState({ ...initialState, currentSpace: res });
    },
  });

  const changeSpaceRoleReq = useRequest(changeSpaceRole, {
    manual: true,
    onSuccess: async () => {
      const res = await getSpace(currentSpace.id);
      setInitialState({ ...initialState, currentSpace: res });
    },
  });

  const columns = [
    {
      title: '角色名',
      dataIndex: 'name',
      width: 150,
      render: (_, role) => {
        return (
          <Text
            editable={{
              onChange: (v) => {
                if (v) changeSpaceRoleReq.run(currentSpace.id, role.id, { name: v });
              },
            }}
          >
            {role.name}
          </Text>
        );
      },
    },
    {
      title: '权限',
      dataIndex: 'access',
      render: (_, role) => {
        return (
          <Select
            disabled={list.map((r) => r.id).indexOf(role.id) === 0}
            defaultValue={role.access}
            onChange={(v) => changeSpaceRoleReq.run(currentSpace.id, role.id, { access: v })}
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

  const actionMenu = (role: RoleRes) => (
    <Menu>
      <Menu.Item disabled={list.map((r) => r.id).indexOf(role.id) === 0} key="1">
        <Popconfirm
          title={
            <div>
              所有赋予该角色的委任都会被移除
              <br />
              你确定要删除该角色么？
            </div>
          }
          onConfirm={() => removeSpaceRoleReq.run(currentSpace.id, role.id)}
          okText="确认"
          cancelText="取消"
        >
          <a href="#">删除</a>
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );

  columns.push({
    dataIndex: 'action',
    title: '操作',
    width: 50,
    render: (_, role: RoleRes) => (
      <Dropdown overlay={actionMenu(role)}>
        <Button icon={<EllipsisOutlined />}></Button>
      </Dropdown>
    ),
  });

  return (
    <Table
      pagination={false}
      rowKey={(e) => e.id}
      columns={columns}
      loading={!list}
      dataSource={list}
    />
  );
};
export default RoleTable;
