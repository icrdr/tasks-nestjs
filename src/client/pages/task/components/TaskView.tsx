import React, { useEffect, useState } from 'react';
import { useModel, useRequest } from 'umi';
import { Button, Form, Input, Modal, Select, Space } from 'antd';
import TaskTable from './TaskTable';
import TaskGallery from './TaskGallery';
import { ViewOption } from '@server/common/common.entity';
import { addSpaceTask, addSubTask, getUser } from '../task.service';
import { AddTaskDTO, TaskMoreDetailRes } from '@dtos/task.dto';
import { getSpaceMembers } from '../../member/member.service';
import { getInitViewOption } from '@utils/utils';
import HeaderFilter from '@components/HeaderFilter';
import HeaderSetting from '@components/HeaderSetting';

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
      title: 'dueAt',
      width: 150,
      filter: undefined,
      hidden: false,
    },
  ],
};

const TaskView: React.FC<{ task?: TaskMoreDetailRes; update?: boolean }> = ({ task, update }) => {
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const [viewUpdate, setViewUpdate] = useState(false);
  const [viewOption, setViewOption] = useState<ViewOption>(null);
  const [memberOptions, setMemberOptions] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const viewOptionKey = task
    ? `task${task.id}SubTaskViewOption`
    : `space${currentSpace.id}TaskViewOption`;

  const isFull = currentSpace?.userAccess === 'full' || task?.userAccess === 'full';
  const isEdit = isFull || (task ? task.userAccess === 'edit' : currentSpace.userAccess === 'edit');

  useEffect(() => {
    const initViewOption = getInitViewOption(
      JSON.parse(localStorage.getItem(viewOptionKey)),
      defaultOption,
      currentSpace.taskProperties,
      currentSpace.roles,
    );

    // get role default filter user
    initViewOption.headers.forEach((header, index) => {
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

    setViewOption(initViewOption);
  }, [update, viewUpdate]);

  const addTask = (body: AddTaskDTO) => {
    return task ? addSubTask(task.id, body) : addSpaceTask(currentSpace.id, body);
  };

  const addTaskReq = useRequest(addTask, {
    manual: true,
    onSuccess: (res) => {
      setViewUpdate(!viewUpdate);
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
              <Button type="primary" onClick={() => setModalVisible(true)}>
                新任务
              </Button>
            )}
            <Select value={viewOption?.form} onChange={handleSeletForm}>
              <Select.Option value="table">表格</Select.Option>
              <Select.Option value="gallery">画廊</Select.Option>
            </Select>
            <HeaderSetting
              headers={viewOption?.headers}
              roles={currentSpace.roles}
              properties={currentSpace.taskProperties}
              onChange={(index, v) => {
                const headers = viewOption.headers;
                headers[index].hidden = !v;
                saveOption({ ...viewOption, headers });
              }}
              onReset={() => {
                setViewUpdate(!viewUpdate);
                localStorage.removeItem(viewOptionKey);
              }}
            />
          </Space>
          <HeaderFilter
            headers={viewOption?.headers}
            roles={currentSpace.roles}
            properties={currentSpace.taskProperties}
            memberOptions={memberOptions}
            onChange={(index, v) => {
              const headers = viewOption.headers.filter((header) => !header.hidden);
              headers[index].filter = v;
              saveOption({ ...viewOption, headers });
            }}
            onSearchMember={(v) => getSpaceMembersReq.run(currentSpace.id, { username: v })}
            serachMemberLoading={getSpaceMembersReq.loading}
          />
        </div>
        <div style={{ height: 'calc(100vh - 100px)' }}>
          {viewOption?.form === 'table' && (
            <TaskTable task={task} headers={viewOption.headers} update={viewUpdate} />
          )}
          {viewOption?.form === 'gallery' && (
            <TaskGallery headers={viewOption.headers} update={viewUpdate} task={task} />
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
