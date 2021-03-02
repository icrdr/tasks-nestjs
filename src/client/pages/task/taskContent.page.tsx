import React, { useRef, useState } from "react";
import { useIntl, useModel, useParams, useRequest } from "umi";
import { getTask } from "./task.service";
import Editor from "@components/Editor";
import { Card, Affix, Button, Drawer, List, Typography, Tooltip } from "antd";
import {
  HistoryOutlined,
  HomeOutlined,
  LoadingOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import Split from "react-split";
import moment from "moment";
import TaskComment from "./components/TaskComment";
const { Text } = Typography;

const TaskContent: React.FC<{}> = () => {
  const { initialState } = useModel("@@initialState");
  const { currentUser } = initialState;
  const currentTaskId = (useParams() as any).id;
  const [update, setUpdate] = useState(true);
  const [contentIndex, setContentIndex] = useState(0);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [isSynced, setSync] = useState(true);
  const taskCommentRef = useRef(null);
  const intl = useIntl();

  const getTaskReq = useRequest(() => getTask(currentTaskId), {
    refreshDeps: [currentTaskId, update],
    formatResult: (res) => {
      res.contents.reverse();
      return res;
    },
    onSuccess: (res) => {
      console.log(res);
    },
  });

  const { data } = getTaskReq;

  // TODO: fake sync catch
  async function waitChange(): Promise<string[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([""]);
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

  const handleHistoryOpen = () => {
    setHistoryVisible(true);
  };

  const handleHistoryClose = () => {
    setHistoryVisible(false);
  };

  const handleContentChange = (index: number) => {
    setContentIndex(index);
    setHistoryVisible(false);
    if (index !== 0) {
      const date = moment(data?.contents[index]?.createAt).toDate();
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
  const editable = data?.state === "inProgress" && contentIndex === 0;
  return (
    <>
      <div
        style={{
          position: "relative",
          width: "100%",
          margin: "0px auto",
          maxWidth: "1200px",
        }}
      >
        <Split
          style={{ display: "flex" }}
          sizes={
            localStorage
              .getItem("taskContentSplit")
              ?.split(",")
              .map((i) => parseFloat(i)) || [66, 33]
          }
          minSize={[300, 0]}
          gutterSize={12}
          onDragEnd={(sizes) => {
            taskCommentRef.current.recomputeRowHeights();
            localStorage.setItem("taskContentSplit", sizes);
          }}
        >
          <div style={{ overflowY: "auto", overflowX: "hidden" }}>
            <Card bordered={false} style={{ minWidth: "300px" }}>
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
                          "YYYY/MM/DD h:mm:ss"
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
                  wsRoom={editable ? `task-${currentTaskId}` : undefined}
                  currentUser={{
                    id: currentUser.id,
                    username: currentUser.username,
                  }}
                  data={
                    !editable
                      ? data.contents[contentIndex]?.content || { blocks: [] }
                      : undefined
                  }
                  onChange={handleEditorChange}
                />
              )}
            </Card>
          </div>
          <Affix offsetTop={0}>
            <div
              style={{
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              <TaskComment taskId={data?.id} ref={taskCommentRef} />
            </div>
          </Affix>
        </Split>
        <Affix
          offsetTop={0}
          style={{ position: "absolute", top: "0", right: "-40px" }}
        >
          <Button
            icon={<HistoryOutlined />}
            size={"large"}
            onClick={handleHistoryOpen}
          />
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
          dataSource={data?.contents}
          split={true}
          renderItem={(content, index) =>
            index !== 0 && (
              <List.Item>
                <Button type="link" onClick={() => handleContentChange(index)}>
                  {moment(content.createAt).format("YYYY/MM/DD h:mm:ss")}
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
