import React, { useRef } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Avatar, Table, Space } from 'antd';
import ProTable, { ProColumns, TableDropdown, ActionType } from '@ant-design/pro-table';
import { useIntl, history, Link, useModel, useParams } from 'umi';
import { getSpaceTasks, getSubTasks } from '../task.service';
import { TaskDetailRes, TaskRes } from '@dtos/task.dto';
import AddTaskForm from './AddTaskForm';
import { AssignmentRes, MemberRes } from '@dtos/space.dto';

const TaskTable: React.FC<{}> = () => {
  const currentTaskId = (useParams() as any).id;
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const params = useParams() as any;
  const actionRef = useRef<ActionType>();
  const intl = useIntl();
  const actionMenu = [
    { key: 'copy', name: '复制' },
    { key: 'delete', name: '删除' },
  ];

  const nameTit = intl.formatMessage({
    id: 'taskTable.name.tit',
  });

  const parentTit = intl.formatMessage({
    id: 'taskTable.parent.tit',
  });

  const stateTit = intl.formatMessage({
    id: 'taskTable.state.tit',
  });

  const tagTit = intl.formatMessage({
    id: 'taskTable.tag.tit',
  });

  const membersTit = intl.formatMessage({
    id: 'taskTable.members.tit',
  });

  const addDataTit = intl.formatMessage({
    id: 'taskTable.addData.tit',
  });

  const stateSuspended = intl.formatMessage({
    id: 'taskState.suspended',
  });
  const stateInProgress = intl.formatMessage({
    id: 'taskState.inProgress',
  });
  const stateUnconfirmed = intl.formatMessage({
    id: 'taskState.unconfirmed',
  });
  const stateCompleted = intl.formatMessage({
    id: 'taskState.completed',
  });

  const actionTit = intl.formatMessage({
    id: 'taskTable.action.tit',
  });

  const columns: ProColumns<TaskRes>[] = [
    {
      dataIndex: 'name',
      title: nameTit,
      render: (_, record) => <Link to={`/task/${record.id}/content`}>{record.name}</Link>,
    },
    {
      dataIndex: 'state',
      title: stateTit,
      valueType: 'select',
      filters: true,
      valueEnum: {
        suspended: {
          text: stateSuspended,
          status: 'Default',
        },
        inProgress: {
          text: stateInProgress,
          status: 'Processing',
        },
        unconfirmed: {
          text: stateUnconfirmed,
          status: 'Warning',
        },
        completed: {
          text: stateCompleted,
          status: 'Success',
        },
      },
    },
    {
      dataIndex: 'dueAt',
      title: '截止日期',
      valueType: 'date',
    },
  ];

  for (const role of currentSpace.roles) {
    const _role = role as string;
    columns.push({
      title: _role,
      dataIndex: _role,
      editable: false,
      render: (_, entity) => {
        const assignments = entity['roles'][_role];
        return (
          <Avatar.Group>
            {assignments.map((assignment: AssignmentRes, index: number) => (
              <Avatar key={index}>{(assignment.members[0] as MemberRes).username}</Avatar>
            ))}
          </Avatar.Group>
        );
      },
    });
  }
  columns.push({
    title: actionTit,
    valueType: 'option',
    render: (text, record, _, action) => [
      <TableDropdown key="actionGroup" onSelect={() => action.reload()} menus={actionMenu} />,
    ],
  });

  return (
    <ProTable<TaskDetailRes>
      search={false}
      rowKey="id"
      columns={columns}
      actionRef={actionRef}
      pagination={{
        defaultPageSize: 20,
      }}
      request={async (_params, sorter, filter) => {
        const res = currentTaskId
          ? await getSubTasks(currentTaskId, { ..._params, ...filter })
          : await getSpaceTasks(currentSpace.id, { ..._params, ...filter });

        console.log(res);
        return {
          data: res.list,
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
        <AddTaskForm
          key="1"
          superTaskId={params?.id}
          onSuccess={() => actionRef.current.reload()}
        />,
      ]}
    />
  );
};
export default TaskTable;
