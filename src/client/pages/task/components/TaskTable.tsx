import React, { useState, useRef } from "react";
import { Avatar, Badge } from "antd";
import moment from "moment";
import { Link, useModel, useRequest } from "umi";
import { getSpaceTasks, getSubTasks } from "../task.service";
import { GetTasksDTO, TaskDetailRes, TaskMoreDetailRes } from "@dtos/task.dto";
import { AssignmentRes, MemberRes } from "@dtos/space.dto";
import { ViewOption } from "@server/common/common.entity";
import VTable from "@components/VTable";

const TaskTable: React.FC<{
  task?: TaskMoreDetailRes;
  option: ViewOption;
  update?: boolean;
}> = ({ task, option, update = false }) => {
  const { initialState } = useModel("@@initialState");
  const { currentSpace } = initialState;
  const [dataUpdate, setDataUpdate] = useState(false);
  const [viewUpdate, setViewUpdate] = useState(false);
  const [taskList, setTaskList] = useState<TaskDetailRes[]>([]);
  const fetchCountRef = useRef(0);
  console.log(option)
  const columns = option.headers
    .filter((header) => !header.hidden)
    .map((header) => {
      const type = header.title.split(":")[0];
      switch (type) {
        case "name":
          return {
            dataIndex: "name",
            title: "任务名",
            width: header.width,
            render: (_, task: TaskDetailRes) => (
              <Link to={`/task/${task.id}/content`}>{task.name}</Link>
            ),
          };
        case "priority":
          return {
            dataIndex: "priority",
            title: "优先级",
            width: header.width,
            render: (_, task: TaskDetailRes) => (
              <Badge className="badge-priority" count={task.priority} />
            ),
          };
        case "state":
          return {
            dataIndex: "state",
            title: "状态",
            width: header.width,
            render: (_, task: TaskDetailRes) => {
              switch (task.state) {
                case "suspended":
                  return <Badge status="default" text="暂停中" />;
                case "inProgress":
                  return <Badge status="processing" text="进行中" />;
                case "unconfirmed":
                  return <Badge status="warning" text="待确认" />;
                case "completed":
                  return <Badge status="success" text="已完成" />;

                default:
                  return <Badge status="warning" text="未知" />;
              }
            },
          };
        case "dueAt":
          return {
            dataIndex: "dueAt",
            title: "死线日",
            width: header.width,
            render: (_, task: TaskDetailRes) => (
              <div>
                {task.dueAt ? moment(task.dueAt).format("YYYY/MM/DD") : "/"}
              </div>
            ),
          };
        case "role":
          const role = currentSpace.roles.filter(
            (r) => r.id === parseInt(header.title.split(":")[1])
          )[0];
          if (!role) return undefined;
          return {
            title: role.name,
            dataIndex: header.title,
            width: header.width,
            render: (_, task) => {
              const assignments = task.roles[role.id];
              return (
                <Avatar.Group>
                  {assignments?.map(
                    (assignment: AssignmentRes, index: number) => (
                      <Avatar key={index}>
                        {assignment.name ||
                          (assignment.members[0] as MemberRes).username}
                      </Avatar>
                    )
                  )}
                </Avatar.Group>
              );
            },
          };
        default:
          return undefined;
      }
    })
    .filter((c) => c !== undefined);

  const getTasks = async (body: GetTasksDTO) => {
    const params = {};
    for (const header of option.headers.filter((header) => !header.hidden)) {
      if (header.filter) {
        switch (header.title) {
          case "dueAt":
            params["dueBefore"] = header.filter;
            break;

          default:
            params[header.title] = header.filter;
            break;
        }
      }
    }

    return task
      ? await getSubTasks(task.id, { ...params, ...body })
      : await getSpaceTasks(currentSpace.id, { ...params, ...body });
  };

  const initTasksReq = useRequest(getTasks, {
    refreshDeps: [task, update, dataUpdate, option],
    onSuccess: (res, params) => {
      setTaskList(Array(res.total).fill(undefined));
      if (fetchCountRef.current !== 0) {
        setViewUpdate(!viewUpdate);
      }
      fetchCountRef.current++;
    },
  });

  const getTasksReq = useRequest(getTasks, {
    manual: true,
    onSuccess: (res, params) => {
      console.log(res);
      for (
        let index = params[0].skip;
        index < params[0].skip + params[0].take;
        index++
      ) {
        taskList[index] = res.list[index - params[0].skip];
      }
      setTaskList(taskList);
    },
  });

  const loadMoreItems = (startIndex: number, stopIndex: number) => {
    console.log(startIndex);
    console.log(stopIndex);
    return getTasksReq.run({
      skip: startIndex,
      take: stopIndex - startIndex + 1,
    });
  };

  return (
    <VTable
      loading={initTasksReq.loading}
      update={viewUpdate}
      dataSource={taskList}
      columns={columns}
      loadMoreItems={loadMoreItems}
    />
  );
}; // Usage

export default TaskTable;
