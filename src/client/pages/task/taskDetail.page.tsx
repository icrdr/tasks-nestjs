import React, { useEffect, useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { useModel, useParams, useRequest } from 'umi';
import { updateTask } from './task.service';
import { getTask } from '../adminTask/adminTask.service';
import Editor from '@components/Editor';
import { Row, Col, Card, Affix, Space } from 'antd';

const TaskDetail: React.FC<{}> = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState;
  const params = useParams() as any;
  const getTaskReq = useRequest(() => getTask(params.id), {
    onSuccess: (res) => {
      console.log(res);
    },
  });
  const { data } = getTaskReq;
  return (
    <PageContainer title={data?.name}>
      <Row gutter={12} style={{ width: '100%', margin: '0px auto', maxWidth: '1200px' }}>
        <Col span={16}>
          {data && (
            <Editor
              loading={getTaskReq.loading}
              wsRoom={data.state === 'inProgress' ? `task-${params.id}` : undefined}
              currentUser={{ id: currentUser.id, username: currentUser.username }}
              data={
                data.state !== 'inProgress'
                  ? data.contents[data.contents.length - 1]?.content
                  : undefined
              }
              // editable
            />
          )}
        </Col>
        <Col span={8}>
          <Affix offsetTop={24}>
            <Card style={{ height: 'calc(100vh - 200px)' }}>1111</Card>
          </Affix>
        </Col>
      </Row>
      {/* {data && (
        <Editor
          loading={getTaskReq.loading}
          wsRoom={data.state === 'inProgress' ? `task-${params.id}` : undefined}
          currentUser={{ id: currentUser.id, username: currentUser.username }}
          data={
            data.state !== 'inProgress'
              ? data.contents[data.contents.length - 1]?.content
              : undefined
          }
          // editable
        />
      )} */}
    </PageContainer>
  );
};
export default TaskDetail;
