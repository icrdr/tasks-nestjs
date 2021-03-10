import React, { useState, useRef, useEffect } from 'react';
import { Avatar, Badge, Tag, Tooltip, Typography } from 'antd';
import moment from 'moment';
import { Link, useModel, useRequest } from 'umi';
import { getSpaceTasks, getSubTasks } from '../task.service';
import { GetTasksDTO, TaskDetailRes, TaskMoreDetailRes } from '@dtos/task.dto';
import VTable from '@components/VTable';
import { AssignmentRes } from '@dtos/assignment.dto';
import PropertyItem from '@components/PropertyItem';
import PropertyAvatar from '@components/PropertyAvatar';
import PropertyNumber from '@components/PropertyNumber';
import { RoleRes } from '@dtos/role.dto';
import { PropertyRes } from '@dtos/property.dto';

const headersToColumns = (headers: any[], roles: RoleRes[], properties: PropertyRes[]) => {
  return headers
    .filter((header) => !header.hidden)
    .map((header) => {
      const type = header.title.split(':')[0];
      switch (type) {
        case 'name':
          return {
            dataIndex: 'name',
            title: '任务名',
            width: header.width,
            render: (_, task: TaskDetailRes) => <Link to={`/task/${task.id}`}>{task.name}</Link>,
          };
        case 'priority':
          return {
            dataIndex: 'priority',
            title: '优先级',
            width: header.width,
            render: (_, task: TaskDetailRes) => <PropertyNumber value={task.priority} />,
          };
        case 'state':
          return {
            dataIndex: 'state',
            title: '状态',
            width: header.width,
            render: (_, task: TaskDetailRes) => {
              switch (task.state) {
                case 'suspended':
                  return <Badge status="default" text="暂停中" />;
                case 'inProgress':
                  return <Badge status="processing" text="进行中" />;
                case 'unconfirmed':
                  return <Badge status="warning" text="待确认" />;
                case 'completed':
                  return <Badge status="success" text="已完成" />;
                default:
                  return <Badge status="warning" text="未知" />;
              }
            },
          };
        case 'dueAt':
          return {
            dataIndex: 'dueAt',
            title: '死线日',
            width: header.width,
            render: (_, task: TaskDetailRes) => (
              <div>{task.dueAt ? moment(task.dueAt).format('YYYY/MM/DD') : '/'}</div>
            ),
          };
        case 'role':
          const role = roles.filter((r) => r.id === parseInt(header.title.split(':')[1]))[0];
          return role
            ? {
                title: role.name,
                dataIndex: header.title,
                width: header.width,
                render: (_, task) => {
                  const users = task?.roles[role.id]?.map((assignment: AssignmentRes) => {
                    return assignment.name
                      ? { id: assignment.id, username: assignment.name }
                      : {
                          id: assignment.id,
                          username: assignment.users[0].username,
                        };
                  });
                  return <PropertyAvatar users={users} />;
                },
              }
            : undefined;
        case 'prop':
          const property = properties.filter(
            (p) => p.id === parseInt(header.title.split(':')[1]),
          )[0];
          return property
            ? {
                title: property.name,
                dataIndex: header.title,
                width: header.width,
                render: (_, task: TaskDetailRes) => {
                  const value = task.properties
                    ? task.properties['prop' + property.id]?.toString()
                    : undefined;
                  return <PropertyItem property={property} value={value} />;
                },
              }
            : undefined;
        default:
          return undefined;
      }
    })
    .filter((c) => c !== undefined);
};

const TaskTable: React.FC<{
  task?: TaskMoreDetailRes;
  headers?: any[];
  update?: boolean;
}> = ({ task, headers = [], update = false }) => {
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const [dataUpdate, setDataUpdate] = useState(false);
  const [viewUpdate, setViewUpdate] = useState(false);
  const [taskList, setTaskList] = useState<TaskDetailRes[]>([]);

  const columns = headersToColumns(headers, currentSpace.roles, currentSpace.taskProperties);

  const getTasks = async (body: GetTasksDTO) => {
    const params = {};
    for (const header of headers.filter((header) => !header.hidden)) {
      if (header.filter) {
        switch (header.title) {
          case 'dueAt':
            params['dueBefore'] = header.filter;
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

  useEffect(() => {
    setViewUpdate(!viewUpdate);
  }, [headers]);

  return <VTable request={getTasks} update={viewUpdate} columns={columns} />;
}; // Usage

export default TaskTable;
