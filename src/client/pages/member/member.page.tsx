import React, { useRef } from 'react';
import { PlusOutlined, EllipsisOutlined } from '@ant-design/icons';
import { Button, Tag, Space, Menu, Dropdown, Avatar } from 'antd';
import ProTable, { ProColumns, TableDropdown, ActionType } from '@ant-design/pro-table';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl, useModel } from 'umi';
import { getSpaceMembers } from './member.service';
import { MemberRes } from '@dtos/space.dto';
import addMemberForm from './components/AddMemberForm';
import AddMemberForm from './components/AddMemberForm';

const UserList: React.FC<{}> = () => {
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const actionRef = useRef<ActionType>();
  const intl = useIntl();

  const createUserBtn = intl.formatMessage({
    id: 'page.member.table.createUser.btn',
  });

  const usernameTit = intl.formatMessage({
    id: 'page.member.table.username.tit',
  });

  const columns: ProColumns<MemberRes>[] = [
    {
      dataIndex: 'username',
      title: usernameTit,
    },
  ];

  return (
    <ProTable<MemberRes>
      rowKey="userId"
      columns={columns}
      actionRef={actionRef}
      request={async (params, sorter, filter) => {
        const res = await getSpaceMembers(currentSpace.id, params);
        console.log(res);
        return {
          data: res.list,
          success: true,
          total: res.total,
        };
      }}
      search={false}
      toolBarRender={() => [<AddMemberForm key="1" onSuccess={() => actionRef.current.reload()} />]}
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
