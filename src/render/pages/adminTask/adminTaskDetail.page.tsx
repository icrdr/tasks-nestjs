import React, { Fragment, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Link, useIntl, useParams, useRequest } from 'umi';
import { changeState, getTask } from './adminTask.service';
import TaskTable from './components/TaskTable';
import { Avatar, Badge, Button, Descriptions, Dropdown, Menu, Modal, Space } from 'antd';
import TaskState from '../../components/TaskState';
import { EllipsisOutlined } from '@ant-design/icons';

const TaskDetail: React.FC<{}> = () => {
  const params = useParams() as any;
  const [update, setUpdate] = useState(true);
  const intl = useIntl();
  const getTaskReq = useRequest(() => getTask(params.id), {
    refreshDeps: [params.id, update],
    onSuccess: (res) => {
      console.log(res);
    },
  });

  const changeStateReq = useRequest(changeState, {
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      setUpdate(!update);
    },
  });

  const { data } = getTaskReq;

  const [tabActiveKey, setTabActiveKey] = useState('subTasks');

  const handleTabChange = (tabActiveKey: string) => {
    setTabActiveKey(tabActiveKey);
  };

  const subTaskTableTit = intl.formatMessage({
    id: 'page.adminTaskDetail.subTaskTable.tit',
  });

  const tabPassRequests = intl.formatMessage({
    id: 'page.adminTaskDetail.tab.passRequests',
  });

  const tabSubTasks = intl.formatMessage({
    id: 'page.adminTaskDetail.tab.subTasks',
  });

  const description = (
    <Descriptions size="small" column={1}>
      <Descriptions.Item label="负责人">
        <Avatar.Group>
          {data?.performers.map(({ id, username }) => (
            <Avatar key={id} size="small">
              {username[0].toUpperCase()}
            </Avatar>
          ))}
        </Avatar.Group>
      </Descriptions.Item>
      <Descriptions.Item label="任务简介">
        <Link to={`/task/${data?.id}`}>{data?.name}</Link>
      </Descriptions.Item>
      <Descriptions.Item label="时间计划">
        {data?.startAt} ~ {data?.endAt}
      </Descriptions.Item>
      <Descriptions.Item label="创建日期">{data?.createAt}</Descriptions.Item>
      <Descriptions.Item label="备注">请于两个工作日内确认</Descriptions.Item>
    </Descriptions>
  );
  const tabList = [
    {
      key: 'subTasks',
      tab: tabSubTasks,
    },
    {
      key: 'passRequests',
      tab: tabPassRequests,
    },
  ];
  const title = () => {
    const parentTask = data?.parentTask;
    return (
      <Space>
        {parentTask && <Link to={`/admin/task/${parentTask.id}`}>{parentTask.name}</Link>}
        {parentTask && <span>/</span>}
        {data?.name}
      </Space>
    );
  };
  const otherActionMenu = (
    <Menu>
      <Menu.Item key="1">删除</Menu.Item>
    </Menu>
  );
  const extraContent = (
    <Space>
      <Button.Group>
        {data?.state === 'suspended' && (
          <Button
            onClick={() => changeStateReq.run(params.id, 'start')}
            disabled={changeStateReq.loading}
          >
            启动
          </Button>
        )}
        {data?.state === 'inProgress' && (
          <Button
            onClick={() => changeStateReq.run(params.id, 'suspend')}
            disabled={changeStateReq.loading}
          >
            暂停
          </Button>
        )}
        {data?.state === 'completed' && (
          <Button
            onClick={() => changeStateReq.run(params.id, 'restart')}
            disabled={changeStateReq.loading}
          >
            重启
          </Button>
        )}
        {data?.state === 'inProgress' && <Button>提交</Button>}
        {data?.state === 'unconfirmed' && <Button>审核</Button>}
        <Dropdown overlay={otherActionMenu} placement="bottomRight">
          <Button>
            <EllipsisOutlined />
          </Button>
        </Dropdown>
      </Button.Group>
      {data?.state !== 'completed' && (
        <Button
          type="primary"
          onClick={() => changeStateReq.run(params.id, 'complete')}
          disabled={changeStateReq.loading}
        >
          完成
        </Button>
      )}
    </Space>
  );

  return (
    <PageContainer
      title={title()}
      extra={<TaskState state={data?.state} />}
      extraContent={extraContent}
      content={description}
      tabActiveKey={tabActiveKey}
      onTabChange={handleTabChange}
      loading={getTaskReq.loading}
      tabList={tabList}
    >
      {tabActiveKey === 'subTasks' && <TaskTable headerTitle={subTaskTableTit} parentTask={data} />}
    </PageContainer>
  );
};
export default TaskDetail;
