import React from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Alert, Typography } from 'antd';
import { Access, useAccess, useRequest } from 'umi';

const Resource: React.FC<{}> = () => {
  const access = useAccess();
  const { loading } = useRequest('/api/users', {
    onSuccess: (res) => {
      console.log(res)
    },
    formatResult: (res) => res,
  });

  return (
    <Access
      accessible={access.hasPerms(['common.*'])}
      fallback={<div>Can not read foo content.</div>}
    >
      <PageContainer>
        <Card>Resource</Card>
      </PageContainer>
    </Access>
  );
};
export default Resource;
