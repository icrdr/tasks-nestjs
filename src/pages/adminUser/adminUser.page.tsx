import React, { useRef } from 'react';
import { PlusOutlined, EllipsisOutlined } from '@ant-design/icons';
import { Button, Tag, Space, Menu, Dropdown, Avatar } from 'antd';
import ProTable, { ProColumns, TableDropdown, ActionType } from '@ant-design/pro-table';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl } from 'umi';
import { getUsers } from './adminUser.service';
import { UserRes } from '@/dtos/user.dto';

const UserList: React.FC<{}> = () => {
  const actionRef = useRef<ActionType>();
  const intl = useIntl();

  const createUserBtn = intl.formatMessage({
    id: 'page.adminUser.table.createUser.btn',
  });

  const usernameTit = intl.formatMessage({
    id: 'page.adminUser.table.username.tit',
  });

  const columns: ProColumns<UserRes>[] = [
    {
      dataIndex: 'username',
      title: usernameTit,
    },
  ];

  return (
    <ProTable<UserRes>
      rowKey="id"
      columns={columns}
      actionRef={actionRef}
      request={async (params, sorter, filter) => {
        const res = await getUsers(params);
        console.log(res);
        return {
          data: res.list,
          success: true,
          total: res.total,
        };
      }}
      search={false}
      toolBarRender={() => [
        <Button key="button" icon={<PlusOutlined />} type="primary">
          {createUserBtn}
        </Button>,
      ]}
    />
  );
};

const User: React.FC<{}> = () => {
  return (
    <PageContainer content="管理所有用户">
      <UserList />
    </PageContainer>
  );
};
export default User;
