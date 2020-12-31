import React from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Alert, Typography } from 'antd';
import { Access, useAccess, useRequest } from 'umi';
import TaskDiscuss from '../task/components/TaskDiscuss';

const Resource: React.FC<{}> = () => {
  return (
    <PageContainer>
      <TaskDiscuss taskId={1}></TaskDiscuss>
    </PageContainer>
  );
};
export default Resource;
