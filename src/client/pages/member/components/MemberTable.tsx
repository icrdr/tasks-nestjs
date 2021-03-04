import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { history, useModel, useRequest } from 'umi';
import { Button, Card, Form, Input, Select, Space, Table, Typography } from 'antd';
import { MemberRes, RoleRes } from '@dtos/space.dto';
import { AccessLevel } from '@server/task/entities/space.entity';
import { useForm } from 'antd/es/form/Form';
import { EditOutlined, HighlightOutlined } from '@ant-design/icons';
import { getSpaceMembers } from '../member.service';
const { Text } = Typography;

const RoleTable: React.FC<{ reload?: boolean }> = (reload) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const { currentUser, currentSpace } = initialState;
  const [memberList, setMemberList] = useState<MemberRes[]>([]);

  const getSpaceMembersReq = useRequest(() => getSpaceMembers(currentSpace.id), {
    refreshDeps: [reload],
    onSuccess: (res) => {
      console.log(res);
      setMemberList(res.list);
    },
  });

  const columns = [
    {
      title: '用户名',
      dataIndex: 'name',
      key: 'name',
      render: (_, member:MemberRes) => {
        return <Text>{member.username}</Text>;
      },
    },
  ];

  return (
    <Table
      pagination={false}
      rowKey={(e) => e.userId}
      columns={columns}
      loading={getSpaceMembersReq.loading}
      dataSource={memberList}
    />
  );
};
export default RoleTable;
