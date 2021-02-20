import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { useRequest } from 'umi';
import { Card, Space, Image } from 'antd';
import TaskTable from './components/TaskTable';
import OssFileCard from './components/OssFileCard';

const Task: React.FC<{}> = () => {
  return (
    <Card>
      <Space size={[16, 16]} wrap>
        {new Array(20).fill(null).map((_, index) => (
          <OssFileCard key={index} width={100} ossObject={'sdfsdf'} />
        ))}
      </Space>
    </Card>
  );
};
export default Task;
