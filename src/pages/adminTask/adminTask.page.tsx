import React, { useRef } from 'react';
import { PlusOutlined, EllipsisOutlined } from '@ant-design/icons';
import { Button, Tag, Space, Menu, Dropdown } from 'antd';
import ProTable, { ProColumns, TableDropdown, ActionType } from '@ant-design/pro-table';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl } from 'umi';
import { getTasks } from './adminTask.service';

interface taskItem {
  url: string;
  id: number;
  number: number;
  title: string;
  labels: {
    name: string;
    color: string;
  }[];
  state: string;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

const TaskList: React.FC<{}> = () => {
  const actionRef = useRef<ActionType>();
  const intl = useIntl();

  const createTaskBtn = intl.formatMessage({
    id: 'page.task.table.createTask.btn',
  });

  const titleTit = intl.formatMessage({
    id: 'page.task.table.title.tit',
  });

  const stateTit = intl.formatMessage({
    id: 'page.task.table.state.tit',
  });

  const tagTit = intl.formatMessage({
    id: 'page.task.table.tag.tit',
  });

  const createDataTit = intl.formatMessage({
    id: 'page.task.table.createData.tit',
  });

  const columns: ProColumns<taskItem>[] = [
    {
      dataIndex: 'name',
      title: titleTit,
    },
    {
      dataIndex: 'state',
      title: stateTit,
      valueType: 'select',
      filters: true,
      valueEnum: {
        all: {
          text: '全部',
          status: 'Default',
        },
        open: {
          text: '未解决',
          status: 'suspended',
        },
        closed: {
          text: '已解决',
          status: 'Success',
        },
        processing: {
          text: '解决中',
          status: 'Processing',
        },
      },
    },
    // {
    //   dataIndex: 'labels',
    //   title: tagTit,
    //   render: (_, record) => (
    //     <Space>
    //       {record.labels.map(({ name, color }) => (
    //         <Tag color={color} key={name}>
    //           {name}
    //         </Tag>
    //       ))}
    //     </Space>
    //   ),
    // },
    {
      dataIndex: 'created_at',
      title: createDataTit,
      valueType: 'date',
    },
  ];

  return (
    <ProTable<taskItem>
      rowKey="id"
      columns={columns}
      actionRef={actionRef}
      request={async (params, sorter, filter) => {
        const res = await getTasks({ perPage: params.pageSize, page: params.current });
        console.log(res);
        return {
          data: res[0],
          success: true,
          total: res[1],
        };
      }}
      search={false}
      toolBarRender={() => [
        <Button key="button" icon={<PlusOutlined />} type="primary">
          {createTaskBtn}
        </Button>,
      ]}
    />
  );
};

const Task: React.FC<{}> = () => {
  return (
    <PageContainer>
      <TaskList />
    </PageContainer>
  );
};
export default Task;
