import React from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Alert, Typography } from 'antd';
import { useRequest } from 'umi';
import { Access, useAccess } from 'umi';

const FFFF: React.FC = () => {
  return <div>2</div>;
};

const Task: React.FC<{}> = () => {
  const access = useAccess();
  return (
    <Access
      accessible={access.hasPerms(['admin.*'])}
      fallback={<div>Can not read foo content.</div>}
    >
      <PageContainer>
        <Card>
          <FFFF />
        </Card>
      </PageContainer>
    </Access>
  );
};

export default Task;
