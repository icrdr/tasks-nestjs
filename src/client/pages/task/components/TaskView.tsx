import React, { useEffect, useState } from "react";
import { useModel, useRequest } from "umi";
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
  DatePicker,
} from "antd";
import TaskTable from "./TaskTable";
import TaskGallery from "./TaskGallery";
import { ViewOption } from "@server/common/common.entity";
import { addSpaceTask, addSubTask, getUser } from "../task.service";
import { AddTaskDTO, TaskMoreDetailRes } from "@dtos/task.dto";
import { SettingOutlined } from "@ant-design/icons";
import moment from "moment";
import { getSpaceMembers } from "../../member/member.service";
import { getInitViewOption } from "@utils/utils";

const TaskView: React.FC<{ task?: TaskMoreDetailRes }> = ({ task }) => {
  const { initialState } = useModel("@@initialState");
  const { currentSpace } = initialState;
  const [viewUpdate, setViewUpdate] = useState(false);
  const [viewOption, setViewOption] = useState<ViewOption>(null);
  const [memberOptions, setMemberOptions] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const viewOptionKey = task
    ? `task${task.id}SubTaskViewOption`
    : `space${currentSpace.id}TaskViewOption`;

  const isFull =
    currentSpace?.userAccess === "full" || task?.userAccess === "full";
  const isEdit =
    isFull ||
    (task ? task.userAccess === "edit" : currentSpace.userAccess === "edit");

  useEffect(() => {
    const initViewOption = getInitViewOption(
      JSON.parse(localStorage.getItem(viewOptionKey)),
      {
        form: "table",
        headers: [
          {
            title: "name",
            width: 200,
            filter: undefined,
            hidden: false,
          },
          {
            title: "priority",
            width: 100,
            filter: undefined,
            hidden: true,
          },
          {
            title: "state",
            width: 100,
            filter: undefined,
            hidden: false,
          },
          {
            title: "dueAt",
            width: 150,
            filter: undefined,
            hidden: false,
          },
        ],
      },
      currentSpace.roles
    );

    // get role default filter user
    initViewOption.headers.forEach((header, index) => {
      const type = header.title.split(":")[0];
      if (type === "role" && header.filter) {
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
  }, [viewUpdate]);

  const addTask = (body: AddTaskDTO) => {
    return task
      ? addSubTask(task.id, body)
      : addSpaceTask(currentSpace.id, body);
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
      console.log(res);

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

  const handleFilter = (index, v) => {
    const headers = viewOption.headers.filter((header) => !header.hidden);
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
  console.log(viewOption?.headers);
  const filter = viewOption?.headers
    .filter((header) => !header.hidden)
    .map((header, index: number) => {
      const type = header.title.split(":")[0];
      switch (type) {
        case "name":
          return (
            <Input.Search
              key={index}
              style={{ width: 150 }}
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
              style={{ width: 150 }}
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
              placeholder={"死线之前"}
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
              onSearch={(v) =>
                getSpaceMembersReq.run(currentSpace.id, { username: v })
              }
              options={memberOptions}
              showSearch
              showArrow={false}
              filterOption={false}
              notFoundContent={
                getSpaceMembersReq.loading ? <Spin size="small" /> : null
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
          case "priority":
            label = "优先级";
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
      <Menu.Item
        key={"reset"}
        onClick={() => {
          setViewUpdate(!viewUpdate);
          localStorage.removeItem(viewOptionKey);
        }}
      >
        重置
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <Space size="middle" direction="vertical" style={{ width: "100%" }}>
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
            <Dropdown overlay={menu}>
              <Button icon={<SettingOutlined />} />
            </Dropdown>
          </Space>
          <Space wrap>{filter}</Space>
        </div>
        <div style={{ height: "calc(100vh - 100px)" }}>
          {viewOption?.form === "table" && (
            <TaskTable option={viewOption} update={viewUpdate} />
          )}
          {viewOption?.form === "gallery" && (
            <TaskGallery option={viewOption} update={viewUpdate} task={task} />
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
            rules={[{ required: true, message: "任务名是必须的" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
export default TaskView;
