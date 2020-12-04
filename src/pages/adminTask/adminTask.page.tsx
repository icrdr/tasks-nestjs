import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { useRequest } from 'umi';
import { getTask } from './adminTask.service';
import { Space } from 'antd';
import TaskDetailCard from './components/TaskDetailCard';
import TaskTable from './components/TaskTable';

const Task: React.FC<{}> = () => {

  return (
    <PageContainer content="管理所有任务">
        <TaskTable/>
    </PageContainer>
  );
};
export default Task;
