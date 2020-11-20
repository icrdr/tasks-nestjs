import React from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Alert, Typography } from 'antd';
import { Access, useAccess } from 'umi';

const Dashboard: React.FC<{}> = () => {
  const access = useAccess();
  return (
    <Access
      accessible={access.hasPerms(['common.*'])}
      fallback={<div>Can not read foo content.</div>}
    >
      <PageContainer>
        <Card>Dashboard</Card>
      </PageContainer>
    </Access>
  );
};
export default Dashboard;
