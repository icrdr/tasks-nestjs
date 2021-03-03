import React from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { history } from 'umi';
import { Card, Space } from 'antd';
import RoleTable from './components/RoleTable';

const Resource: React.FC<{}> = (props) => {
  return (
    <div style={{ padding: 20 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Card>setting</Card>
        <RoleTable />
      </Space>
    </div>
  );
};
export default Resource;
