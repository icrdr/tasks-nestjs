import React, { useEffect, useState } from 'react';
import { useModel, useRequest } from 'umi';
import { Badge, Button, Form, Input, Modal, Select, Space, Switch } from 'antd';
import TaskTable from './TaskTable';
import TaskGallery from './TaskGallery';
import { ViewOption } from '@server/common/common.entity';
import { addSpaceTask, addSubTask, getUser } from '../task.service';
import { AddTaskDTO, TaskMoreDetailRes } from '@dtos/task.dto';
import { getSpaceMembers } from '../../member/member.service';
import { getInitViewOption } from '@utils/utils';
import HeaderFilter from '@components/HeaderFilter';
import HeaderSetting from '@components/HeaderSetting';
import { ContainerOutlined } from '@ant-design/icons';
import FilterDateRange from '../../../components/FilterDateRange';
import FilterString from '../../../components/FilterString';

const defaultOption = {
  form: 'table',
  headers: [
    {
      title: 'name',
      width: 200,
      filter: undefined,
      hidden: false,
    },
    {
      title: 'priority',
      width: 100,
      filter: undefined,
      hidden: true,
    },
    {
      title: 'state',
      width: 100,
      filter: undefined,
      hidden: false,
    },
    {
      title: 'beginAt',
      width: 150,
      filter: undefined,
      hidden: false,
    },
    {
      title: 'dueAt',
      width: 150,
      filter: undefined,
      hidden: false,
    },
    {
      title: 'createAt',
      width: 150,
      filter: undefined,
      hidden: true,
    },
    {
      title: 'completeAt',
      width: 150,
      filter: undefined,
      hidden: true,
    },
  ],
};

const labelRender = (type: string) => {
  switch (type) {
    case 'name':
      return '任务名';
    case 'priority':
      return '优先级';
    case 'state':
      return '状态';
    case 'createAt':
      return '创建日期';
    case 'dueAt':
      return '死线日期';
    case 'beginAt':
      return '开启日期';
    case 'completeAt':
      return '完成日期';
    default:
      return type;
  }
};

const filterRender = (type, filter, index, onChange) => {
  switch (type) {
    case 'name':
      return (
        <FilterString
          key={index}
          placeholder="任务名"
          onChange={(v) => onChange(index, v)}
          value={filter || ''}
        />
      );
    case 'state':
      return (
        <Select
          key={index}
          style={{ width: 100 }}
          placeholder={'状态'}
          defaultValue={filter || undefined}
          onChange={(v) => onChange(index, v)}
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
    case 'dueAt':
      return (
        <FilterDateRange
          key={index}
          placeholder={['死线起始', '死线结束']}
          value={filter || undefined}
          onChange={(dates) => onChange(index, dates)}
        />
      );
    case 'beginAt':
      return (
        <FilterDateRange
          key={index}
          placeholder={['开启起始', '开启结束']}
          value={filter || undefined}
          onChange={(dates) => onChange(index, dates)}
        />
      );
    case 'completeAt':
      return (
        <FilterDateRange
          key={index}
          placeholder={['完成起始', '完成结束']}
          value={filter || undefined}
          onChange={(dates) => onChange(index, dates)}
        />
      );
    case 'createAt':
      return (
        <FilterDateRange
          key={index}
          placeholder={['创建起始', '创建结束']}
          value={filter || undefined}
          onChange={(dates) => onChange(index, dates)}
        />
      );
  }
};

const TaskView: React.FC<{ task?: TaskMoreDetailRes; update?: boolean }> = ({ task, update }) => {
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;

  const viewOptionKey = task
    ? `task${task.id}SubTaskViewOption`
    : `space${currentSpace.id}TaskViewOption`;

  const [childUpdate, setChildUpdate] = useState(false);
  const [viewOption, setViewOption] = useState<ViewOption>(
    getInitViewOption(
      JSON.parse(localStorage.getItem(viewOptionKey)),
      defaultOption,
      currentSpace.taskProperties,
      currentSpace.roles,
    ),
  );
  const [memberOptions, setMemberOptions] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editable, setEditable] = useState(false);
  const [form] = Form.useForm();

  const isFull = currentSpace?.userAccess === 'full' || task?.userAccess === 'full';
  const isEdit = isFull || (task ? task.userAccess === 'edit' : currentSpace.userAccess === 'edit');

  useEffect(() => {
    // get role default filter user
    viewOption.headers.forEach((header, index) => {
      const type = header.title.split(':')[0];
      if (type === 'role' && header.filter) {
        getUser(header.filter)
          .then((res) => {
            setMemberOptions([{ label: res.username, value: res.id }]);
          })
          .catch((err) => {
            const headers = viewOption.headers;
            headers[index].filter = undefined;
            console.log(headers);
            saveOption({ ...viewOption, headers });
          });
      }
    });
  }, []);

  const addTask = (body: AddTaskDTO) => {
    return task ? addSubTask(task.id, body) : addSpaceTask(currentSpace.id, body);
  };

  const addTaskReq = useRequest(addTask, {
    manual: true,
    onSuccess: (res) => {
      setChildUpdate(!childUpdate);
    },
  });

  const getSpaceMembersReq = useRequest(getSpaceMembers, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
      const memberOptions = res.list.map((member) => {
        return {
          label: member.username,
          value: member.userId,
        };
      });
      setMemberOptions(memberOptions);
    },
  });

  const saveOption = (option) => {
    setViewOption(option);
    localStorage.setItem(viewOptionKey, JSON.stringify(option));
    setChildUpdate(!childUpdate);
  };

  const resetOption = () => {
    localStorage.removeItem(viewOptionKey);
    setViewOption(
      getInitViewOption(undefined, defaultOption, currentSpace.taskProperties, currentSpace.roles),
    );
    setChildUpdate(!childUpdate);
  };

  const handleSeletForm = (v) => {
    saveOption({ ...viewOption, form: v });
  };

  return (
    <>
      <Space size="middle" direction="vertical" style={{ width: '100%' }}>
        <div className="left-right-layout-container">
          <Space>
            {isEdit && (
              <Button
                type="primary"
                onClick={() => setModalVisible(true)}
                icon={<ContainerOutlined />}
              >
                新任务
              </Button>
            )}
            <Select value={viewOption?.form} onChange={handleSeletForm}>
              <Select.Option value="table">表格</Select.Option>
              <Select.Option value="gallery">画廊</Select.Option>
            </Select>
            <HeaderSetting
              labelRender={labelRender}
              headers={viewOption?.headers}
              roles={currentSpace.roles}
              properties={currentSpace.taskProperties}
              onChange={(index, v) => {
                const headers = viewOption.headers;
                headers[index].hidden = !v;
                saveOption({ ...viewOption, headers });
              }}
              onReset={resetOption}
            />
            {isEdit && (
              <Switch
                checkedChildren="编辑"
                unCheckedChildren="阅读"
                checked={editable}
                onChange={(v) => setEditable(v)}
              />
            )}
          </Space>
          <HeaderFilter
            filterRender={filterRender}
            headers={viewOption?.headers}
            roles={currentSpace.roles}
            properties={currentSpace.taskProperties}
            memberOptions={memberOptions}
            onChange={(index, v) => {
              const headers = viewOption.headers;
              headers[index].filter = v;
              saveOption({ ...viewOption, headers });
            }}
            onSearchMember={(v) => getSpaceMembersReq.run(currentSpace.id, { username: v })}
            serachMemberLoading={getSpaceMembersReq.loading}
          />
        </div>
        <div style={{ height: 'calc(100vh - 100px)' }}>
          {viewOption?.form === 'table' && (
            <TaskTable task={task} editable={editable} headers={viewOption.headers} update={childUpdate} />
          )}
          {viewOption?.form === 'gallery' && (
            <TaskGallery task={task} headers={viewOption.headers} update={childUpdate} />
          )}
        </div>
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
            rules={[{ required: true, message: '任务名是必须的' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
export default TaskView;
