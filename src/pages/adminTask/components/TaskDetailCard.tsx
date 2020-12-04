import React from 'react';
import { Spin } from 'antd';
import { TaskDetailRes, TaskRes } from '@/dtos/task.dto';
import ProCard from '@ant-design/pro-card';
import { BackgroundColor } from 'chalk';

const TaskDetailCard: React.FC<{
  data: TaskDetailRes;
  loading: boolean;
}> = ({ data, loading }) => {
  return (
    //FIXME: proCard is not working with realDark theme
    <ProCard style={{ backgroundColor: 'rgb(20, 20, 20)' }} title={data?.name} loading={loading}>
      {data?.name}
    </ProCard>
  );
};
export default TaskDetailCard;
