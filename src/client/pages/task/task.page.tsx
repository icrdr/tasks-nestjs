import React, { useEffect, useState } from "react";
import { PageContainer } from "@ant-design/pro-layout";
import { useModel, useParams, useRequest } from "umi";
import {
  Badge,
  Button,
  Dropdown,
  Form,
  Input,
  Switch,
  Menu,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  DatePicker,
} from "antd";
import TaskTable from "./components/TaskTable";
import TaskGallery from "./components/TaskGallery";
import { ViewForm, ViewOption } from "@server/task/entities/property.entity";
import {
  addSpaceTask,
  addSubTask,
  getSpaceTasks,
  getSubTasks,
  getUser,
  getUsers,
} from "./task.service";
import { AddTaskDTO } from "@dtos/task.dto";
import { SettingOutlined } from "@ant-design/icons";
import moment from "moment";
import { useUpdate, useUpdateEffect } from "ahooks";

const Task: React.FC<{}> = () => {
  const currentTaskId = (useParams() as any).id;
  const { initialState } = useModel("@@initialState");
  const { currentSpace } = initialState;
  const viewOptionKey = currentTaskId
    ? `task${currentTaskId}`
    : `space${currentSpace.id}` + "ViewOption";

  useEffect(() => {
    const initViewOption = JSON.parse(localStorage.getItem(viewOptionKey)) || {
      form: "table",
      headers: [
        {
          title: "name",
          width: 200,
          filter: undefined,
          hidden: false,
        },
        {
          title: "state",
          width: 200,
          filter: undefined,
          hidden: false,
        },
        {
          title: "dueAt",
          width: 200,
          filter: undefined,
          hidden: false,
        },
      ],
    };

    //refresh role column
    const commonHeaders = initViewOption.headers.filter(
      (h) => h.title.split(":")[0] !== "role"
    );
    const headerTitles = initViewOption.headers.map((h) => h.title);
    const headers = [...commonHeaders];
    for (const role of currentSpace.roles) {
      const index = headerTitles.indexOf(`role:${role.id}`);
      if (index < 0) {
        headers.push({
          title: `role:${role.id}`,
          width: 200,
          filter: undefined,
          hidden: false,
        });
      } else {
        headers.push(initViewOption.headers[index]);
      }
    }
    console.log("render");
    // get role default filter user
    headers.forEach((header, index) => {
      const type = header.title.split(":")[0];
      if (type === "role" && header.filter) {
        getUser(header.filter)
          .then((res) => {
            console.log(res);
            setUserOptions([{ label: res.username, value: res.id }]);
          })
          .catch((err) => {
            const headers = viewOption.headers;
            headers[index].filter = undefined;
            console.log(headers);
            saveOption({ ...viewOption, headers });
          });
      }
    });

    initViewOption.headers = headers;
    setViewOption(initViewOption);
  }, []);

  const [update, setUpdate] = useState(false);
  const [viewOption, setViewOption] = useState<ViewOption>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [userOptions, setUserOptions] = React.useState([]);
  const [form] = Form.useForm();

  const addTask = (body: AddTaskDTO) => {
    return currentTaskId
      ? addSubTask(currentTaskId, body)
      : addSpaceTask(currentSpace.id, body);
  };

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
    headers[index].filter = v;
    saveOption({ ...viewOption, headers });
  };
  const handleHeaderDisplay = (index, v) => {
    const headers = viewOption.headers;
    headers[index].hidden = !v;
    saveOption({ ...viewOption, headers });
  };
  // const handleSelect = (index, v) => {
  //   const headers = viewOption.headers;
  //   headers[index]['filter'] = v;
  //   saveOption({ ...viewOption, headers });
  // };

  const filter = viewOption?.headers
    .filter((header) => !header.hidden)
    .map((header, index: number) => {
      const type = header.title.split(":")[0];
      switch (type) {
        case "name":
          return (
            <Input.Search
              key={index}
              style={{ width: 200 }}
              placeholder="任务名"
              onSearch={(v) => handleFilter(index, v)}
              defaultValue={header.filter || ""}
              allowClear
            />
          );
        case "state":
          return (
            <Select
              key={index}
              style={{ width: 100 }}
              placeholder={"状态"}
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
        case "dueAt":
          return (
            <DatePicker
              key={index}
              placeholder={"截止日之前"}
              defaultValue={header.filter ? moment(header.filter) : undefined}
              onChange={(v) => handleFilter(index, v?.toDate() || undefined)}
            />
          );
        case "role":
          const role = currentSpace.roles.filter(
            (r) => r.id === parseInt(header.title.split(":")[1])
          )[0];
          return (
            <Select
              key={index}
              style={{ width: 100 }}
              placeholder={role.name}
              defaultValue={header.filter || undefined}
              onChange={(v) => handleFilter(index, v)}
              onSearch={(v) => getUsersReq.run({ username: v })}
              options={userOptions}
              showSearch
              showArrow={false}
              filterOption={false}
              notFoundContent={
                getUsersReq.loading ? <Spin size="small" /> : null
              }
              allowClear
            />
          );

        default:
          <div></div>;
      }
    });

  const menu = (
    <Menu>
      {viewOption?.headers.map((header, index) => {
        const type = header.title.split(":")[0];
        let title =
          type === "role"
            ? currentSpace.roles.filter(
                (r) => r.id === parseInt(header.title.split(":")[1])
              )[0].name
            : type;

        let label = "";
        switch (title) {
          case "name":
            label = "任务名";
            break;
          case "state":
            label = "状态";
            break;
          case "dueAt":
            label = "截止日";
            break;
          default:
            label = title;
            break;
        }
        return (
          <Menu.Item key={index}>
            <Space>
              <Switch
                disabled={title === "name"}
                size="small"
                defaultChecked={!header.hidden}
                onChange={(v) => handleHeaderDisplay(index, v)}
              />
              <span>{label}</span>
            </Space>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  return (
    <div style={{ padding: 20 }}>
      <Space size="middle" direction="vertical" style={{ width: "100%" }}>
        <div>
          <Button
            type="primary"
            style={{ marginRight: "20px" }}
            onClick={() => setModalVisible(true)}
          >
            新任务
          </Button>
          <Space>
            <Select value={viewOption?.form} onChange={handleSeletForm}>
              <Select.Option value="table">表格</Select.Option>
              <Select.Option value="gallery">画廊</Select.Option>
            </Select>
            <Dropdown overlay={menu} >
              <Button icon={<SettingOutlined />} />
            </Dropdown>
          </Space>
          <Space style={{ float: "right" }}>{filter}</Space>
        </div>
        {viewOption?.form === "table" && (
          <TaskTable option={viewOption} reload={update} />
        )}
        {viewOption?.form === "gallery" && (
          <TaskGallery option={viewOption} reload={update} />
        )}
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
            rules={[{ required: true, message: "任务名是必须的" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default Task;
