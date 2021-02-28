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
import { addSubTask, addSpaceTask, getUsersByfullName } from "../task.service";

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

  const membersTit = intl.formatMessage({
    id: "addTaskFrom.members.tit",
  });

  const membersPhd = intl.formatMessage({
    id: "addTaskFrom.members.phd",
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
          history.push(`/task/${res.id}/content`);
          return true;
        } catch (error) {
          return false;
        }
      }}
    >
      <ProForm.Group>
        <ProFormText
          width="m"
          name="name"
          label={nameTit}
          placeholder={namePhd}
          rules={nameRule}
        />
        <ProFormSelect
          width="m"
          name="memberId"
          label={membersTit}
          placeholder={membersPhd}
          valueEnum={valueEnum}
          fieldProps={{
            mode: "multiple",
            filterOption: false,
            onSearch: (value) => getUsersReq.run(value),
          }}
        />
      </ProForm.Group>
    </ModalForm>
  );
};

export default AddTaskForm;
