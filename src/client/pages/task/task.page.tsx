import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { useRequest } from 'umi';
import { Select, Space } from 'antd';
import TaskTable from './components/TaskTable';
import TaskGallery from './components/TaskGallery';

const Task: React.FC<{}> = () => {
  const [viewType, setViewType] = useState('gallery');
  return (
    <PageContainer content="管理所有任务">
      <Space size="middle" direction="vertical" style={{ width: '100%' }}>
        <Select value={viewType} onChange={(v) => setViewType(v)}>
          <Select.Option value="table">表格</Select.Option>
          <Select.Option value="gallery">画廊</Select.Option>
        </Select>
        {viewType === 'table' && <TaskTable />}
        {viewType === 'gallery' && <TaskGallery />}
      </Space>
    </PageContainer>
  );
};
export default Task;
