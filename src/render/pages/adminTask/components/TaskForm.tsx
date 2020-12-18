import React, { useState } from 'react';
import { Button, message, Spin } from 'antd';
import { TaskDetailRes, TaskRes } from '@/dtos/task.dto';
import ProCard from '@ant-design/pro-card';
import { BackgroundColor } from 'chalk';
import { useIntl, history, Link, useRequest } from 'umi';
import Mock from 'mockjs';

import ProForm, {
  ModalForm,
  ProFormText,
  ProFormDateRangePicker,
  ProFormSelect,
} from '@ant-design/pro-form';
import { PlusOutlined } from '@ant-design/icons';
import { createSubTask, createTask, getUsersByfullName } from '../adminTask.service';

const TaskForm: React.FC<{ disabled?: boolean; parentTaskId?: number; onSuccess?: Function }> = ({
  onSuccess = () => {},
  parentTaskId,
  disabled = false,
}) => {
  const intl = useIntl();

  const createTaskReq = useRequest(createTask, {
    manual: true,
  });

  const createSubTaskReq = useRequest(createSubTask, {
    manual: true,
  });

  const getUsersReq = useRequest(getUsersByfullName, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
      console.log(res);
      let valueEnum = {};
      res.list.map((item) => {
        valueEnum[item.id] = item.username;
      });
      console.log(valueEnum);
      setValueEnum(valueEnum);
    },
  });

  const [state, setstate] = useState([]);
  const [valueEnum, setValueEnum] = useState({});

  const createTaskBtn = intl.formatMessage({
    id: 'taskFrom.createTask.btn',
  });

  const createSubTaskBtn = intl.formatMessage({
    id: 'taskFrom.createSubTask.btn',
  });

  const nameTit = intl.formatMessage({
    id: 'taskFrom.name.tit',
  });

  const namePhd = intl.formatMessage({
    id: 'taskFrom.name.phd',
  });

  const descriptionTit = intl.formatMessage({
    id: 'taskFrom.description.tit',
  });

  const descriptionPhd = intl.formatMessage({
    id: 'taskFrom.description.phd',
  });

  const performersTit = intl.formatMessage({
    id: 'taskFrom.performers.tit',
  });

  const performersPhd = intl.formatMessage({
    id: 'taskFrom.performers.phd',
  });

  const nameRule = [
    {
      required: true,
      message: intl.formatMessage({
        id: 'taskFrom.name.required',
      }),
    },
  ];

  const descriptionRule = [
    {
      required: true,
      message: intl.formatMessage({
        id: 'taskFrom.description.required',
      }),
    },
  ];

  return (
    <ModalForm
      title={parentTaskId ? createSubTaskBtn : createTaskBtn}
      trigger={
        <Button type="primary" disabled={disabled || createTaskReq.loading}>
          <PlusOutlined />
          {parentTaskId ? createSubTaskBtn : createTaskBtn}
        </Button>
      }
      onFinish={async (value: any) => {
        console.log(value)
        try {
          parentTaskId
            ? await createSubTaskReq.run(parentTaskId, value)
            : await createTaskReq.run(value);
          onSuccess();
          return true;
        } catch (error) {
          return false;
        }
      }}
    >
      <ProForm.Group>
        <ProFormText width="m" name="name" label={nameTit} placeholder={namePhd} rules={nameRule} />
        <ProFormText
          width="l"
          name="description"
          label={descriptionTit}
          placeholder={descriptionPhd}
        />
        <ProFormSelect
          width="m"
          name="performerId"
          label={performersTit}
          placeholder={performersPhd}
          valueEnum={valueEnum}
          fieldProps={{
            mode: 'multiple',
            filterOption: false,
            onSearch: (value) => getUsersReq.run(value),
          }}
        />
      </ProForm.Group>
    </ModalForm>
  );
};

export default TaskForm;
