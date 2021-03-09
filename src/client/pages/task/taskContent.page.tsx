import React, { useRef, useState } from 'react';
import { useModel, useRequest } from 'umi';
import Editor from '@components/Editor';
import { Card, Affix, Button, Drawer, List, Typography, Tooltip } from 'antd';
import { HistoryOutlined, HomeOutlined, LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import Split from 'react-split';
import moment from 'moment';
import TaskComment from './components/TaskComment';
import { TaskMoreDetailRes } from '@dtos/task.dto';
import { useUpdateEffect } from 'ahooks';
const { Text } = Typography;

const TaskContent: React.FC<{ task: TaskMoreDetailRes; update? }> = ({ task, update = false }) => {
  const { initialState } = useModel('@@initialState');
  const { currentUser, currentSpace } = initialState;
  const [contentIndex, setContentIndex] = useState(0);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [editorUpdate, setEditorUpdate] = useState(false);
  const [isSynced, setSync] = useState(true);
  const taskCommentRef = useRef(null);

  const isFull = currentSpace?.userAccess === 'full' || task?.userAccess === 'full';
  const isEdit = isFull || (task ? task.userAccess === 'edit' : currentSpace.userAccess === 'edit');

  // TODO: fake sync catch
  async function waitChange(): Promise<string[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(['']);
      }, 2000);
    });
  }

  useUpdateEffect(() => {
    setEditorUpdate(!editorUpdate);
  }, [update]);

  const waitChangeReq = useRequest(waitChange, {
    debounceInterval: 2000,
    manual: true,
    onSuccess: () => {
      window.onbeforeunload = undefined;
      setSync(true);
    },
  });

  const handleHistoryOpen = () => {
    setHistoryVisible(true);
  };

  const handleHistoryClose = () => {
    setHistoryVisible(false);
  };

  const handleContentChange = (index: number) => {
    setContentIndex(index);
    setEditorUpdate(!editorUpdate);
    setHistoryVisible(false);
    if (index !== 0) {
      const date = moment(task?.contents[index]?.createAt).toDate();
      taskCommentRef.current.scrollToDate(date);
    } else {
      taskCommentRef.current.scrollToBottom();
    }

    // setUpdate(!update);
  };
  const handleEditorChange = () => {
    window.onbeforeunload = () => true;
    setSync(false);
    waitChangeReq.run();
  };

  const editable =
    ['inProgress', 'unconfirmed'].indexOf(task.state) >= 0 && contentIndex === 0 && isEdit;
  
  return (
    <>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          margin: '0px auto',
          maxWidth: '1200px',
        }}
      >
        <Split
          style={{ display: 'flex' }}
          sizes={
            localStorage
              .getItem('taskContentSplit')
              ?.split(',')
              .map((i) => parseFloat(i)) || [66, 33]
          }
          minSize={[300, 0]}
          gutterSize={12}
          onDragEnd={(sizes) => {
            taskCommentRef.current.recomputeRowHeights();
            localStorage.setItem('taskContentSplit', sizes);
          }}
        >
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
                        {moment(task?.contents[contentIndex]?.createAt).format(
                          'YYYY/MM/DD h:mm:ss',
                        )}
                        &nbsp;&nbsp;
                        <HomeOutlined />
                      </a>
                    </Tooltip>
                  )
                )}
              </div>
              <Editor
                loading={!task}
                wsRoom={editable ? `task-${task.id}` : undefined}
                currentUser={{
                  id: currentUser.id,
                  username: currentUser.username,
                }}
                data={
                  !editable ? task.contents[contentIndex]?.content || { blocks: [] } : undefined
                }
                editable={editable}
                update={editorUpdate}
                onChange={handleEditorChange}
              />
            </Card>
          </div>
          <Affix offsetTop={0}>
            <div
              style={{
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            >
              <TaskComment editable={editable} taskId={task?.id} ref={taskCommentRef} />
            </div>
          </Affix>
        </Split>
        <Affix offsetTop={0} style={{ position: 'absolute', top: '0px', right: '-20px' }}>
          <Button icon={<HistoryOutlined />} shape="circle" onClick={handleHistoryOpen} />
        </Affix>
      </div>
      <Drawer
        title="历史内容"
        closable={false}
        width={300}
        placement="right"
        visible={historyVisible}
        onClose={handleHistoryClose}
        getContainer={false}
        bodyStyle={{ padding: 0 }}
      >
        <List
          dataSource={task?.contents}
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
    </>
  );
};
export default TaskContent;
