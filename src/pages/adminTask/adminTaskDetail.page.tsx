import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl, useParams, useRequest } from 'umi';
import { getTask } from './adminTask.service';
import TaskTable from './components/TaskTable';
import TaskDetailCard from './components/TaskDetailCard';
import { Space } from 'antd';

const TaskDetail: React.FC<{}> = () => {
  const params = useParams() as any;
  const intl = useIntl();
  const getTaskReq = useRequest(() => getTask(params.id), {
    refreshDeps: [params.id],
  });

  const subTaskTableTit = intl.formatMessage({
    id: 'page.adminTaskDetail.subTaskTable.tit',
  });

  return (
    <PageContainer content="任务详情">
      <Space direction="vertical" size="middle" className={'w:full'}>
        <TaskDetailCard data={getTaskReq.data} loading={getTaskReq.loading} />
        <TaskTable headerTitle={subTaskTableTit} showParentTask={false} />
      </Space>
    </PageContainer>
  );
};
export default TaskDetail;
