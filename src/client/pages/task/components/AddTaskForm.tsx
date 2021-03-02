import React, { useState } from "react";
import { Button, message, Spin } from "antd";
import { BackgroundColor } from "chalk";
import { useIntl, history, Link, useRequest, useModel } from "umi";
import Mock from "mockjs";

import ProForm, {
  ModalForm,
  ProFormText,
  ProFormDateRangePicker,
  ProFormSelect,
} from "@ant-design/pro-form";
import { PlusOutlined } from "@ant-design/icons";
import { addSubTask, addSpaceTask } from "../task.service";

const AddTaskForm: React.FC<{
  disabled?: boolean;
  superTaskId?: number;
}> = ({ superTaskId, disabled = false }) => {
  const { initialState } = useModel("@@initialState");
  const { currentSpace } = initialState;
  const intl = useIntl();

  const addSpaceTaskReq = useRequest(addSpaceTask, {
    manual: true,
  });

  const addSubTaskReq = useRequest(addSubTask, {
    manual: true,
  });

  const addTaskBtn = intl.formatMessage({
    id: "addTaskFrom.addTask.btn",
  });

  const addSubTaskBtn = intl.formatMessage({
    id: "addTaskFrom.addSubTask.btn",
  });

  const nameTit = intl.formatMessage({
    id: "addTaskFrom.name.tit",
  });

  const namePhd = intl.formatMessage({
    id: "addTaskFrom.name.phd",
  });

  const nameRule = [
    {
      required: true,
      message: intl.formatMessage({
        id: "addTaskFrom.name.required",
      }),
    },
  ];

  return (
    <ModalForm
      title={superTaskId ? addSubTaskBtn : addTaskBtn}
      trigger={
        <Button
          icon={<PlusOutlined />}
          disabled={disabled || addSpaceTaskReq.loading}
        >
          {superTaskId ? addSubTaskBtn : addTaskBtn}
        </Button>
      }
      onFinish={async (value: any) => {
        console.log(value);
        try {
          const res = superTaskId
            ? await addSubTaskReq.run(superTaskId, value)
            : await addSpaceTaskReq.run(currentSpace.id, value);
          
          return true;
        } catch (error) {
          return false;
        }
      }}
    >
      <ProFormText
        width="m"
        name="name"
        label={nameTit}
        placeholder={namePhd}
        rules={nameRule}
      />
    </ModalForm>
  );
};

export default AddTaskForm;
