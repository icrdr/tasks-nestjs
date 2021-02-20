import React, { useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Link, useIntl, history, useParams, useRequest } from 'umi';
import { changeState } from './task.service';
import { getTask } from './task.service';
import { Space, Button, Descriptions, Dropdown, Menu } from 'antd';
import TaskState from '../../components/TaskState';
import { EllipsisOutlined } from '@ant-design/icons';

const taskDetail: React.FC<{}> = (props) => {
  const params = useParams() as any;
  const [update, setUpdate] = useState(true);
  const intl = useIntl();
  const path = history.location.pathname.split('/');
  const tabActiveKey = path[path.length - 1];

  const getTaskReq = useRequest(() => getTask(params.id), {
    refreshDeps: [params.id, update],
    formatResult: (res) => {
      res.contents.reverse();
      return res;
    },
    onSuccess: (res) => {
      console.log(res);
    },
  });

  const changeStateReq = useRequest(changeState, {
    manual: true,
    onSuccess: (res) => {
      setUpdate(!update);
    },
  });

  const { data } = getTaskReq;

  const handleTabChange = (tabActiveKey: string) => {
    history.push(`/task/${getTaskReq.data.id}/${tabActiveKey}`);
  };

  const tabContents = intl.formatMessage({
    id: 'page.taskContent.tab.contents',
  });

  const tabAssets = intl.formatMessage({
    id: 'page.taskContent.tab.assets',
  });

  const tabSubTasks = intl.formatMessage({
    id: 'page.taskContent.tab.subTasks',
  });

  const title = () => {
    const superTask = data?.superTask;
    return (
      <Space>
        {superTask && <Link to={`/task/${superTask.id}`}>{superTask.name}</Link>}
        {superTask && <span>/</span>}
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
        {data?.state === 'inProgress' && (
          <Button
            onClick={() => changeStateReq.run(params.id, 'commit')}
            disabled={changeStateReq.loading}
          >
            提交
          </Button>
        )}
        {data?.state === 'unconfirmed' && (
          <Button
            onClick={() => changeStateReq.run(params.id, 'refuse')}
            disabled={changeStateReq.loading}
          >
            打回
          </Button>
        )}
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

  const description = (
    <Descriptions size="small" column={1}>
      <Descriptions.Item label="指派">
        {/* <Avatar.Group>
          {data?.performers.map(({ id, username }) => (
            <Avatar key={id} size="small">
              {username[0].toUpperCase()}
            </Avatar>
          ))}
        </Avatar.Group> */}
      </Descriptions.Item>
      <Descriptions.Item label="时间计划">
        {data?.startAt} ~ {data?.endAt}
      </Descriptions.Item>
    </Descriptions>
  );
  const tabList = [
    {
      key: 'content',
      tab: tabContents,
    },
    {
      key: 'asset',
      tab: tabAssets,
    },
    {
      key: 'subTask',
      tab: tabSubTasks,
    },
  ];

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
      {props.children}
    </PageContainer>
  );
};
export default taskDetail;
