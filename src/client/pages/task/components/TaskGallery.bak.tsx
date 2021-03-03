import React, { useRef } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Avatar, Table, Space, Card } from "antd";
import ProTable, {
  ProColumns,
  TableDropdown,
  ActionType,
} from "@ant-design/pro-table";
import { useIntl, Link, useModel, useParams } from "umi";
import { getSpaceTasks, getSubTasks } from "../task.service";
import { TaskDetailRes, TaskRes } from "@dtos/task.dto";
import AddTaskForm from "./AddTaskForm";
import ProList from "@ant-design/pro-list";
import FileCard from "./FileCard";
import { getOssClient } from "../../layout/layout.service";
import TaskCard from "./TaskCard";

const TaskGallery: React.FC<{}> = () => {
  const currentTaskId = (useParams() as any).id;
  const { initialState } = useModel("@@initialState");
  const { currentSpace } = initialState;
  const actionRef = useRef<ActionType>();
  const intl = useIntl();
  const actionMenu = [
    { key: "copy", name: "复制" },
    { key: "delete", name: "删除" },
  ];

  const nameTit = intl.formatMessage({
    id: "taskTable.name.tit",
  });

  const parentTit = intl.formatMessage({
    id: "taskTable.parent.tit",
  });

  const stateTit = intl.formatMessage({
    id: "taskTable.state.tit",
  });

  const tagTit = intl.formatMessage({
    id: "taskTable.tag.tit",
  });

  const membersTit = intl.formatMessage({
    id: "taskTable.members.tit",
  });

  const addDataTit = intl.formatMessage({
    id: "taskTable.addData.tit",
  });

  const stateSuspended = intl.formatMessage({
    id: "taskState.suspended",
  });
  const stateInProgress = intl.formatMessage({
    id: "taskState.inProgress",
  });
  const stateUnconfirmed = intl.formatMessage({
    id: "taskState.unconfirmed",
  });
  const stateCompleted = intl.formatMessage({
    id: "taskState.completed",
  });

  const actionTit = intl.formatMessage({
    id: "taskTable.action.tit",
  });

  const metas = {
    name:{
      dataIndex: "name",
      title: nameTit,
    },
    state:{
      dataIndex: "state",
      title: stateTit,
      valueType: "select",
      valueEnum: {
        suspended: {
          text: stateSuspended,
          status: "Default",
        },
        inProgress: {
          text: stateInProgress,
          status: "Processing",
        },
        unconfirmed: {
          text: stateUnconfirmed,
          status: "Warning",
        },
        completed: {
          text: stateCompleted,
          status: "Success",
        },
      },
    },
    dueAt:{
      dataIndex: "dueAt",
      title: "截止日期",
      valueType: "date",
    },
  }

  return (
    <ProList<TaskDetailRes>
      renderItem={(task: TaskDetailRes, index: number) => (
        <div style={{ padding: 10 }} key={index}>
          <Link to={`/task/${task.id}/content`}>
            <TaskCard
              content={task.content.content}
              name={task.name}
              cover={task["_preview"]}
            ></TaskCard>
          </Link>
        </div>
      )}
      //@ts-ignore
      metas={metas}
      rowKey="id"
      actionRef={actionRef}
      pagination={{
        defaultPageSize: 20,
      }}
      search={{
        filterType: "light",
      }}
      grid={{ gutter: 4, column: 4 }}
      request={async (params, sorter, filter) => {
        console.log(params)
        const res = currentTaskId
          ? await getSubTasks(currentTaskId, {
              ...params,
              ...sorter,
              ...filter,
            })
          : await getSpaceTasks(currentSpace.id, {
              ...params,
              ...sorter,
              ...filter,
            });

        console.log(res);
        const oss = await getOssClient();
        const tasks = res.list.map((task) => {
          let cover;
          for (const block of task.content.content?.blocks || []) {
            if (block.type === "image") {
              cover = block.data.file.source;
              break;
            }
          }
          if (cover) {
            const _cover = cover.split(":");
            task["_source"] =
              _cover[0] === "oss"
                ? oss.signatureUrl(_cover[1], { expires: 3600 })
                : _cover[1];
            task["_preview"] =
              _cover[0] === "oss"
                ? oss.signatureUrl(_cover[1], {
                    expires: 3600,
                    process: "image/resize,w_500,h_150",
                  })
                : _cover[1];
          } else {
            task["_source"] = (
              <div
                style={{ background: "white", width: "200px", height: "200px" }}
              >
                <h3 style={{ lineHeight: "200px", textAlign: "center" }}>
                  no preview
                </h3>
              </div>
            );
          }
          return task;
        });

        return {
          data: tasks,
          success: true,
          total: res.total,
        };
      }}
      options={{
        fullScreen: true,
      }}
      rowSelection={{
        selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
      }}
      tableAlertRender={({ selectedRowKeys, onCleanSelected }) => (
        <Space size="middle">
          <span>
            已选 {selectedRowKeys.length} 项
            <a style={{ marginLeft: 8 }} onClick={onCleanSelected}>
              取消选择
            </a>
          </span>
        </Space>
      )}
      tableAlertOptionRender={() => {
        return (
          <Space size="middle">
            <a>批量删除</a>
            <a>导出数据</a>
          </Space>
        );
      }}
      toolBarRender={() => [
        <AddTaskForm key="1" superTaskId={currentTaskId} />,
      ]}
    />
  );
};
export default TaskGallery;
