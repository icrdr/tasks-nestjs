import React from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Alert, Typography } from 'antd';
import { Access, useAccess, useRequest } from 'umi';

const Dashboard: React.FC<{}> = () => {
  const access = useAccess();
  const { loading } = useRequest('/api/users', {
    onSuccess: (res) => {
      console.log(res);
    },
    formatResult: (res) => res,
  });

  return (
    <PageContainer>
      <Card>Dashboard</Card>
    </PageContainer>
  );
};
export default Dashboard;
