import React, { useState, useRef, useEffect } from 'react';
import { Avatar, Badge, Button, Dropdown, Menu, Popconfirm, Tag, Tooltip, Typography } from 'antd';
import moment from 'moment';
import { Link, useModel, useRequest } from 'umi';
import {
  addTaskAssignment,
  changeTask,
  changeTaskState,
  getSpaceGroups,
  getSpaceTasks,
  getSubTasks,
  removeTask,
  removeTaskAssignment,
} from '../task.service';
import { ChangeTaskDTO, GetTasksDTO, TaskDetailRes, TaskMoreDetailRes } from '@dtos/task.dto';
import VTable from '@components/VTable';
import { AddAssignmentDTO, AssignmentRes } from '@dtos/assignment.dto';
import PropertyItem from '@components/PropertyItem';
import PropertyAvatar from '@components/PropertyAvatar';
import PropertyNumber from '@components/PropertyNumber';
import { RoleRes } from '@dtos/role.dto';
import { PropertyRes } from '@dtos/property.dto';
import PropertyString from '@components/PropertyString';
import PropertyDate from '@components/PropertyDate';
import PropertyRadio from '../../../components/PropertyRadio';
import { getSpaceMembers } from '../../member/member.service';
import { EllipsisOutlined } from '@ant-design/icons';

const TaskTable: React.FC<{
  task?: TaskMoreDetailRes;
  headers?: any[];
  editable?: boolean;
  update?: boolean;
}> = ({ task, headers = [], editable = false, update = false }) => {
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const [thisUpdate, setThisUpdate] = useState(false);
  const [childUpdate, setChildUpdate] = useState(false);
  const isFull = currentSpace?.userAccess === 'full';
  editable = isFull && editable;
  const vTableRef = useRef(null);
  const [memberOptions, setMemberOptions] = useState([]);

  const getSpaceGroupsReq = useRequest(() => getSpaceGroups(currentSpace.id), {
    onSuccess: (res) => {
      const memberOptions = res.list.map((group) => {
        return {
          label: group.name,
          value: `group:${group.id}`,
        };
      });
      setMemberOptions(memberOptions);
    },
  });

  useEffect(() => {
    setColumns(headersToColumns(headers, currentSpace.roles, currentSpace.taskProperties));
  }, [editable]);

  const changeTaskWithRowIndex = (id: number, body: ChangeTaskDTO, rowIndex) => {
    return changeTask(id, body);
  };

  const removeTaskAssignmentWithRowIndex = (id: number, assignmentId: number, rowIndex) => {
    return removeTaskAssignment(id, assignmentId);
  };

  const addTaskAssignmentWithRowIndex = (id: number, body: AddAssignmentDTO, rowIndex) => {
    return addTaskAssignment(id, body);
  };

  const changeTaskStateWithRowIndex = (id: number, action, rowIndex) => {
    return changeTaskState(id, action);
  };

  const getSpaceMembersReq = useRequest(getSpaceMembers, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      // const singleAssignments = task["roles"][modalRoleId]?.filter(
      //   (a) => a.members.length === 1
      // );
      // const memberUserIds = singleAssignments?.map(
      //   (a) => a.members[0].userId
      // );
      // const isExist = memberUserIds?.indexOf(member.userId) >= 0;
      const memberOptions = res.list.map((member) => {
        return {
          label: member.username,
          value: `user:${member.userId}`,
        };
      });
      const groupOptions = memberOptions.filter((option) => option.value.split(':')[0] === 'group');
      setMemberOptions([...groupOptions, ...memberOptions]);
    },
  });

  const changeTaskReq = useRequest(changeTaskWithRowIndex, {
    manual: true,
    onSuccess: (res, params) => {
      vTableRef.current.setRowItem(params[2], res);
    },
  });

  const removeTaskReq = useRequest(removeTask, {
    manual: true,
    onSuccess: (res) => {
      setThisUpdate(!thisUpdate);
    },
  });

  const addAssignmentReq = useRequest(addTaskAssignmentWithRowIndex, {
    manual: true,
    onSuccess: (res, params) => {
      const groupOptions = memberOptions.filter((option) => option.value.split(':')[0] === 'group');
      setMemberOptions(groupOptions);
      vTableRef.current.setRowItem(params[2], res);
    },
  });

  const removeAssignmentReq = useRequest(removeTaskAssignmentWithRowIndex, {
    manual: true,
    onSuccess: (res, params) => {
      vTableRef.current.setRowItem(params[2], res);
    },
  });

  const changeTaskStateReq = useRequest(changeTaskStateWithRowIndex, {
    manual: true,
    onSuccess: (res, params) => {
      vTableRef.current.setRowItem(params[2], res);
    },
  });

  const headersToColumns = (headers: any[], roles: RoleRes[], properties: PropertyRes[]) => {
    const _column = headers
      .filter((header) => !header.hidden)
      .map((header) => {
        const type = header.title.split(':')[0];
        switch (type) {
          case 'name':
            return {
              title: '任务名',
              width: header.width,
              itemRender: (task: TaskDetailRes, columnIndex, rowIndex) => (
                <PropertyString
                  value={task.name}
                  link={`/task/${task.id}`}
                  editable={editable}
                  onChange={(v) => changeTaskReq.run(task.id, { name: v }, rowIndex)}
                />
              ),
            };
          case 'priority':
            return {
              title: '优先级',
              width: header.width,
              itemRender: (task: TaskDetailRes, columnIndex, rowIndex) => (
                <PropertyNumber
                  value={task.priority}
                  editable={editable}
                  onChange={(v) => changeTaskReq.run(task.id, { priority: v }, rowIndex)}
                />
              ),
            };
          case 'state':
            return {
              title: '状态',
              width: header.width,
              itemRender: (task: TaskDetailRes, columnIndex, rowIndex) => (
                <PropertyRadio
                  value={task.state}
                  options={[
                    { label: '暂停中', value: 'suspended', status: 'default' },
                    { label: '进行中', value: 'inProgress', status: 'processing' },
                    { label: '待确认', value: 'unconfirmed', status: 'warning' },
                    { label: '已完成', value: 'completed', status: 'success' },
                  ]}
                  mode="badge"
                  // editable={editable}
                  // onChange={(v) => changeTaskStateReq.run(task.id, { priority: v }, rowIndex)}
                />
              ),
            };
          case 'beginAt':
            return {
              title: '开启日期',
              width: header.width,
              itemRender: (task: TaskDetailRes, columnIndex, rowIndex) => (
                <PropertyDate
                  value={task.beginAt}
                  editable={editable}
                  onChange={(v) => changeTaskReq.run(task.id, { beginAt: v }, rowIndex)}
                />
              ),
            };
          case 'dueAt':
            return {
              title: '死线日期',
              width: header.width,
              itemRender: (task: TaskDetailRes, columnIndex, rowIndex) => (
                <PropertyDate
                  value={task.dueAt}
                  editable={editable}
                  onChange={(v) => changeTaskReq.run(task.id, { dueAt: v }, rowIndex)}
                />
              ),
            };
          case 'createAt':
            return {
              title: '创建日期',
              width: header.width,
              itemRender: (task: TaskDetailRes) => <PropertyDate value={task.createAt} />,
            };
          case 'completeAt':
            return {
              title: '完成日期',
              width: header.width,
              itemRender: (task: TaskDetailRes) => <PropertyDate value={task.completeAt} />,
            };
          case 'role':
            const role = roles.filter((r) => r.id === parseInt(header.title.split(':')[1]))[0];
            return role
              ? {
                  title: role.name,
                  width: header.width,
                  itemRender: (task: TaskDetailRes, columnIndex, rowIndex) => {
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
                  width: header.width,
                  itemRender: (task: TaskDetailRes, columnIndex, rowIndex) => {
                    const value = task.properties
                      ? task.properties['prop' + property.id]?.toString()
                      : undefined;
                    return (
                      <PropertyItem
                        property={property}
                        value={value}
                        editable={editable}
                        onChange={(v) => {
                          const properties = task.properties || {};
                          properties['prop' + property.id] = v;
                          changeTaskReq.run(task.id, { properties }, rowIndex);
                        }}
                      />
                    );
                  },
                }
              : undefined;
        }
      })
      .filter((c) => c !== undefined);

    const actionMenu = (task: TaskDetailRes) => (
      <Menu>
        <Menu.Item key="delete">
          <Popconfirm
            title="你确定要删除该任务么？"
            onConfirm={() => removeTaskReq.run(task.id)}
            okText="确认"
            cancelText="取消"
          >
            <a href="#">删除</a>
          </Popconfirm>
        </Menu.Item>
      </Menu>
    );

    _column.push({
      title: '操作',
      width: 100,
      itemRender: (task: TaskDetailRes) => (
        <Dropdown overlay={actionMenu(task)}>
          <Button icon={<EllipsisOutlined />}></Button>
        </Dropdown>
      ),
    });
    return _column;
  };

  const [columns, setColumns] = useState(
    headersToColumns(headers, currentSpace.roles, currentSpace.taskProperties),
  );

  useEffect(() => {
    setColumns(headersToColumns(headers, currentSpace.roles, currentSpace.taskProperties));
    setChildUpdate(!childUpdate);
  }, [update, thisUpdate]);

  const getTasks = async (body: GetTasksDTO) => {
    const params = {};
    for (const header of headers.filter((header) => !header.hidden)) {
      if (header.filter) params[header.title] = header.filter;
    }

    return task
      ? await getSubTasks(task.id, { ...params, ...body })
      : await getSpaceTasks(currentSpace.id, { ...params, ...body });
  };

  return <VTable ref={vTableRef} request={getTasks} columns={columns} update={childUpdate} />;
}; // Usage

export default TaskTable;
