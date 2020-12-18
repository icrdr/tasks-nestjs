import React, { useEffect, useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { useModel, useParams, useRequest } from 'umi';
import { updateTask } from './task.service';
import { getTask } from '../adminTask/adminTask.service';
import Editor from '../../components/Editor';


const TaskDetail: React.FC<{}> = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState;
  const params = useParams() as any;
  const getTaskReq = useRequest(() => getTask(params.id), {});
  const updateTaskReq = useRequest(updateTask, {
    manual: true,
    debounceInterval: 1000,
    onSuccess: (res) => {
      console.log(res);
    },
  });

  return (
    <PageContainer title={getTaskReq.data?.name}>
      <Editor
        loading={getTaskReq.loading}
        currentUser={{ id: currentUser.id, username: currentUser.username }}
        content={getTaskReq.data?.content}
        editable
        onSaved={(output) => {
          updateTaskReq.run(params.id, { content: output });
        }}
      />
    </PageContainer>
  );
};
export default TaskDetail;
