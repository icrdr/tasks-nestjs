import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { useModel, useParams, useRequest } from 'umi';
import { Badge, Button, Dropdown, Form, Input, List, Modal, Select, Space, Spin, Tag } from 'antd';
import TaskTable from './components/TaskTable';
import TaskGallery from './components/TaskGallery';
import { ViewOption } from '@server/task/entities/property.entity';
import {
  addSpaceTask,
  addSubTask,
  getSpaceTasks,
  getSubTasks,
  getUser,
  getUsers,
} from './task.service';
import { AddTaskDTO } from '@dtos/task.dto';
import { SettingOutlined } from '@ant-design/icons';

const Task: React.FC<{}> = () => {
  const currentTaskId = (useParams() as any).id;
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const viewOptionKey = currentTaskId
    ? `task${currentTaskId}`
    : `space${currentSpace.id}` + 'ViewOption';

  const [update, setUpdate] = useState(false);
  const [viewOption, setViewOption] = useState<ViewOption>(
    JSON.parse(localStorage.getItem(viewOptionKey)) || {
      form: 'table',
      headers: [
        {
          title: 'name',
          width: 200,
        },
        {
          title: 'state',
          width: 200,
        },
        {
          title: 'dueAt',
          width: 200,
        },
      ],
    },
  );

  const [isModalVisible, setModalVisible] = useState(false);
  const [userOptions, setUserOptions] = React.useState([]);
  const [form] = Form.useForm();
  const addTask = (body: AddTaskDTO) => {
    return currentTaskId ? addSubTask(currentTaskId, body) : addSpaceTask(currentSpace.id, body);
  };

  useEffect(() => {
    viewOption.headers.forEach((header, index) => {
      const type = header.title.split(':')[0];
      if (type === 'role' && header.filter) {
        getUser(header.filter)
          .then((res) => {
            console.log(res);
            setUserOptions([{ label: res.username, value: res.id }]);
          })
          .catch((err) => {
            const headers = viewOption.headers;
            headers[index]['filter'] = undefined;
            console.log(headers);
            saveOption({ ...viewOption, headers });
          });
      }
    });
  }, []);

  const addTaskReq = useRequest(addTask, {
    manual: true,
    onSuccess: (res) => {
      setUpdate(!update);
    },
  });

  const getUsersReq = useRequest(getUsers, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
      console.log(res);

      const userOptions = res.list.map((user) => {
        return {
          label: user.username,
          value: user.id,
        };
      });
      setUserOptions(userOptions);
    },
  });

  const saveOption = (option) => {
    setViewOption(option);
    localStorage.setItem(viewOptionKey, JSON.stringify(option));
  };
  const handleSeletForm = (v) => {
    console.log(v);
    saveOption({ ...viewOption, form: v });
  };

  const handleFilter = (index, v) => {
    const headers = viewOption.headers;
    headers[index]['filter'] = v;
    saveOption({ ...viewOption, headers });
  };

  // const handleSelect = (index, v) => {
  //   const headers = viewOption.headers;
  //   headers[index]['filter'] = v;
  //   saveOption({ ...viewOption, headers });
  // };

  const Filters = viewOption.headers.map((header, index: number) => {
    const type = header.title.split(':')[0];
    switch (type) {
      case 'name':
        return (
          <Input.Search
            key={index}
            style={{ width: 200 }}
            placeholder="任务名"
            onSearch={(v) => handleFilter(index, v)}
            defaultValue={header.filter || ''}
            allowClear
          />
        );
      case 'state':
        return (
          <Select
            key={index}
            style={{ width: 100 }}
            placeholder={'状态'}
            defaultValue={header.filter || undefined}
            onChange={(v) => handleFilter(index, v)}
            allowClear
          >
            <Select.Option value="suspended">
              <Badge status="default" text="暂停中" />
            </Select.Option>
            <Select.Option value="inProgress">
              <Badge status="processing" text="进行中" />
            </Select.Option>
            <Select.Option value="unconfirmed">
              <Badge status="warning" text="待确认" />
            </Select.Option>
            <Select.Option value="completed">
              <Badge status="success" text="已完成" />
            </Select.Option>
          </Select>
        );
      case 'role':
        const roleName = header.title.split(':')[1];
        return (
          <Select
            key={index}
            style={{ width: 100 }}
            placeholder={roleName}
            defaultValue={header.filter || undefined}
            onChange={(v) => handleFilter(index, v)}
            onSearch={(v) => getUsersReq.run({ username: v })}
            options={userOptions}
            showSearch
            filterOption={false}
            notFoundContent={getUsersReq.loading ? <Spin size="small" /> : null}
            allowClear
          />
        );

      default:
        <div></div>;
    }
  });

  const menu = (
    <List bordered>
      <List.Item>asdfasdf</List.Item>
      <List.Item>asdfasdf</List.Item>
      <List.Item>asdfasdf</List.Item>
    </List>
  );
  return (
    <PageContainer content="管理所有任务">
      <Space size="middle" direction="vertical" style={{ width: '100%' }}>
        <div>
          <Button
            type="primary"
            style={{ marginRight: '20px' }}
            onClick={() => setModalVisible(true)}
          >
            新任务
          </Button>
          <Space>
            <Select value={viewOption.form} onChange={handleSeletForm}>
              <Select.Option value="table">表格</Select.Option>
              <Select.Option value="gallery">画廊</Select.Option>
            </Select>
            <Dropdown overlay={menu}>
              <Button icon={<SettingOutlined />} />
            </Dropdown>
          </Space>
          <Space style={{ float: 'right' }}>{Filters}</Space>
        </div>
        {viewOption.form === 'table' && <TaskTable option={viewOption} reload={update} />}
        {viewOption.form === 'gallery' && <TaskGallery option={viewOption} reload={update} />}
      </Space>
      <Modal
        closable={false}
        visible={isModalVisible}
        onOk={() => {
          form.submit();
          setModalVisible(false);
        }}
        onCancel={() => setModalVisible(false)}
      >
        <Form
          name="name"
          form={form}
          onFinish={(value: any) => {
            addTaskReq.run(value);
            form.resetFields();
          }}
        >
          <Form.Item
            label="任务名"
            name="name"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};
export default Task;
