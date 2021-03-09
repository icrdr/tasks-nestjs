import React, { useState } from "react";
import { PlusOutlined, EllipsisOutlined } from "@ant-design/icons";
import {
  Button,
  Space,
  Menu,
  Dropdown,
  Avatar,
  List,
  Card,
  Popover,
  Select,
  Spin,
  Typography,
  Tooltip,
  Popconfirm,
} from "antd";
import { useModel, useRequest } from "umi";
import {
  addSpaceGroupMember,
  changeSpaceGroup,
  getSpaceMembers,
  removeSpaceGroup,
  removeSpaceGroupMember,
} from "../member.service";
import { getSpaceGroups } from "../../task/task.service";
import { UserRes } from "@dtos/user.dto";
import { AssignmentRes } from "@dtos/assignment.dto";
import { RoleRes } from "@dtos/role.dto";
import PropertyAvatar from "@components/PropertyAvatar";
const { Text, Title } = Typography;

const GroupList: React.FC<{ update?: boolean }> = ({ update }) => {
  const { initialState } = useModel("@@initialState");
  const { currentSpace } = initialState;
  const [groupList, setGroupList] = useState<AssignmentRes[]>([]);
  const [dataUpdate, setDataUpdate] = useState(false);
  const removeSpaceGroupMemberReq = useRequest(removeSpaceGroupMember, {
    manual: true,
    onSuccess: (res) => {
      setDataUpdate(!dataUpdate);
    },
  });

  const removeSpaceGroupReq = useRequest(removeSpaceGroup, {
    manual: true,
    onSuccess: (res) => {
      setDataUpdate(!dataUpdate);
    },
  });

  const addSpaceGroupMemberReq = useRequest(addSpaceGroupMember, {
    manual: true,
    onSuccess: (res) => {
      setMemberOptions([]);
      setDataUpdate(!dataUpdate);
    },
  });

  const changeSpaceGroupReq = useRequest(changeSpaceGroup, {
    manual: true,
    onSuccess: (res) => {
      setDataUpdate(!dataUpdate);
    },
  });

  const getSpaceGroupsReq = useRequest(() => getSpaceGroups(currentSpace.id), {
    refreshDeps: [update, dataUpdate],
    onSuccess: (res) => {
      setGroupList(res.list);
    },
  });
  const [memberOptions, setMemberOptions] = useState([]);
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

  const actionMenu = (group: AssignmentRes) => (
    <Menu>
      <Menu.Item
        disabled={groupList.map((g) => g.id).indexOf(group.id) === 0}
        key="1"
      >
        <Popconfirm
          title="你确定要删除该小组么？"
          onConfirm={() => removeSpaceGroupReq.run(currentSpace.id, group.id)}
          okText="确认"
          cancelText="取消"
        >
          <a href="#">删除</a>
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );

  return (
    <List
      grid={{
        gutter: 16,
        xs: 1,
        sm: 2,
        md: 3,
        lg: 4,
        xl: 4,
        xxl: 4,
      }}
      loading={getSpaceGroupsReq.loading}
      dataSource={groupList}
      renderItem={(item, index) => (
        <List.Item>
          <Card
            title={
              <Text
                editable={{
                  onChange: (v) => {
                    if (v)
                      changeSpaceGroupReq.run(currentSpace.id, item.id, {
                        name: v,
                      });
                  },
                }}
              >
                {item?.name}
              </Text>
            }
            extra={[
              <Select
                key="access"
                style={{ marginRight: 10 }}
                disabled={index === 0}
                value={item.role.id}
                options={currentSpace.roles.map((role: RoleRes) => {
                  return {
                    label: role.name,
                    value: role.id,
                  };
                })}
                onChange={(v) =>
                  changeSpaceGroupReq.run(currentSpace.id, item.id, {
                    roleId: v,
                  })
                }
              ></Select>,
              <Dropdown key="action" overlay={actionMenu(item)}>
                <Button icon={<EllipsisOutlined />}></Button>
              </Dropdown>,
            ]}
          >
            <PropertyAvatar
              editable={true}
              users={item.users}
              searchLoading={getSpaceMembersReq.loading}
              options={memberOptions}
              onAdd={(v) =>
                addSpaceGroupMemberReq.run(currentSpace.id, item.id, v)
              }
              onRemove={(id) =>
                removeSpaceGroupMemberReq.run(currentSpace.id, item.id, id)
              }
              onSearch={(v) =>
                getSpaceMembersReq.run(currentSpace.id, { username: v })
              }
            />
          </Card>
        </List.Item>
      )}
    />
  );
};

export default GroupList;
