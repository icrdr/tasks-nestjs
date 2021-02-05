import React, { useEffect, useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Link, useIntl, useModel, useParams, useRequest } from 'umi';
import { changeState, updateTask } from './task.service';
import { getTask } from './task.service';
import Editor from '@components/Editor';
import {
  Row,
  Col,
  Card,
  Affix,
  Space,
  Button,
  Descriptions,
  Dropdown,
  Menu,
  Drawer,
  List,
  Typography,
  Tooltip,
} from 'antd';
import TaskState from '../../components/TaskState';
import {
  EllipsisOutlined,
  HistoryOutlined,
  HomeOutlined,
  LoadingOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import Split from 'react-split';
import { ContentRes } from '@dtos/task.dto';
import moment from 'moment';
import TaskComment from './components/TaskComment';
import Task from './task.page';
const { Text } = Typography;

const TaskContent: React.FC<{}> = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState;
  const params = useParams() as any;
  const [update, setUpdate] = useState(true);
  const [contentIndex, setContentIndex] = useState(0);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [isSynced, setSync] = useState(true);

  const intl = useIntl();

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

  const [tabActiveKey, setTabActiveKey] = useState('contents');

  const handleTabChange = (tabActiveKey: string) => {
    setTabActiveKey(tabActiveKey);
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

  // TODO: fake sync catch
  async function waitChange(): Promise<string[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(['']);
      }, 2000);
    });
  }

  const waitChangeReq = useRequest(waitChange, {
    debounceInterval: 2000,
    manual: true,
    onSuccess: () => {
      window.onbeforeunload = undefined;
      setSync(true);
    },
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
      key: 'contents',
      tab: tabContents,
    },
    {
      key: 'subTasks',
      tab: tabSubTasks,
    },
    {
      key: 'assets',
      tab: tabAssets,
    },
  ];

  const handleHistoryOpen = () => {
    setHistoryVisible(true);
  };

  const handleHistoryClose = () => {
    setHistoryVisible(false);
  };

  const handleContentChange = (index: number) => {
    setContentIndex(index);
    setHistoryVisible(false);
    // setUpdate(!update);
  };
  const handleEditorChange = () => {
    window.onbeforeunload = () => true;
    setSync(false);
    waitChangeReq.run();
  };
  const editable = data?.state === 'inProgress' && contentIndex === 0;
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
      <div style={{ position: 'relative', width: '100%', margin: '0px auto', maxWidth: '1200px' }}>
        <Split style={{ display: 'flex' }} sizes={[66, 33]} minSize={[300, 0]} gutterSize={12}>
          <div style={{ overflowY: 'auto', overflowX: 'hidden' }}>
            <Card bordered={false} style={{ minWidth: '300px' }}>
              <div className="ce-state-icon">
                {editable ? (
                  isSynced ? (
                    <SaveOutlined />
                  ) : (
                    <LoadingOutlined />
                  )
                ) : (
                  contentIndex !== 0 && (
                    <Tooltip title="回到最新">
                      <a onClick={() => handleContentChange(0)}>
                        {moment(data?.contents[contentIndex]?.createAt).format(
                          'YYYY/MM/DD h:mm:ss',
                        )}
                        &nbsp;&nbsp;
                        <HomeOutlined />
                      </a>
                    </Tooltip>
                  )
                )}
              </div>
              {data && (
                <Editor
                  loading={getTaskReq.loading}
                  wsRoom={editable ? `task-${params.id}` : undefined}
                  currentUser={{ id: currentUser.id, username: currentUser.username }}
                  data={
                    !editable ? data.contents[contentIndex]?.content || { blocks: [] } : undefined
                  }
                  onChange={handleEditorChange}
                />
              )}
            </Card>
          </div>
          <Affix offsetTop={0}>
            <div
              style={{
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            >
              <TaskComment taskId={data?.id} />
            </div>
          </Affix>
        </Split>
        <Affix offsetTop={0} style={{ position: 'absolute', top: '0', left: '-50px' }}>
          <Button icon={<HistoryOutlined />} size={'large'} onClick={handleHistoryOpen} />
        </Affix>
      </div>
      <Drawer
        title="历史内容"
        closable={false}
        width={300}
        placement="left"
        visible={historyVisible}
        onClose={handleHistoryClose}
        getContainer={false}
        bodyStyle={{ padding: 0 }}
      >
        <List
          dataSource={data?.contents}
          split={true}
          renderItem={(content, index) =>
            index !== 0 && (
              <List.Item>
                <Button type="link" onClick={() => handleContentChange(index)}>
                  {moment(content.createAt).format('YYYY/MM/DD h:mm:ss')}
                </Button>
              </List.Item>
            )
          }
        />
      </Drawer>
    </PageContainer>
  );
};
export default TaskContent;
