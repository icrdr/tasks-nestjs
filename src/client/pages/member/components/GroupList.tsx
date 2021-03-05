import React, { useRef, useState } from 'react';
import { PlusOutlined, EllipsisOutlined } from '@ant-design/icons';
import {
  Button,
  Tag,
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
} from 'antd';
import ProTable, { ProColumns, TableDropdown, ActionType } from '@ant-design/pro-table';
import { PageContainer } from '@ant-design/pro-layout';
import { useIntl, useModel, useRequest } from 'umi';
import {
  addSpaceGroupMember,
  changeSpaceGroup,
  getSpaceMembers,
  removeSpaceGroupMember,
} from '../member.service';
import { AssignmentRes, MemberRes, RoleRes } from '@dtos/space.dto';
import { getSpaceGroups } from '../../task/task.service';
const { Text, Title } = Typography;

const GroupList: React.FC<{ update?: boolean }> = ({ update }) => {
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const [groupList, setGroupList] = useState<AssignmentRes[]>([]);
  const [dataUpdate, setDataUpdate] = useState(false);
  const removeSpaceGroupMemberReq = useRequest(removeSpaceGroupMember, {
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
      console.log('groupList', res.list);
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
  return (
    <List
      grid={{
        gutter: 16,
        xs: 1,
        sm: 2,
        md: 3,
        lg: 3,
        xl: 3,
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
                    if (v) changeSpaceGroupReq.run(currentSpace.id, item.id, { name: v });
                  },
                }}
              >
                {item?.name}
              </Text>
            }
            extra={
              <Select
                disabled={index === 0}
                value={item.role.id}
                options={currentSpace.roles.map((role: RoleRes) => {
                  return {
                    label: role.name,
                    value: role.id,
                  };
                })}
                onChange={(v) => changeSpaceGroupReq.run(currentSpace.id, item.id, { roleId: v })}
              ></Select>
            }
          >
            <Space size={'small'} align="start">
              <Avatar.Group>
                {(item.members as MemberRes[]).map((member, i: number) => (
                  <Dropdown
                    disabled={index === 0 && item.members.length <= 1}
                    overlay={
                      <Menu>
                        <Menu.Item
                          key="1"
                          onClick={() =>
                            removeSpaceGroupMemberReq.run(currentSpace.id, item.id, member.userId)
                          }
                        >
                          删除
                        </Menu.Item>
                      </Menu>
                    }
                    key={i}
                    trigger={['contextMenu']}
                  >
                    <Tooltip title={member.username}>
                      <Avatar>{member.username}</Avatar>
                    </Tooltip>
                  </Dropdown>
                ))}
              </Avatar.Group>
              <Popover
                placement="right"
                content={
                  <Select
                    style={{ width: 100 }}
                    onChange={(v: number) =>
                      addSpaceGroupMemberReq.run(currentSpace.id, item.id, v)
                    }
                    onSearch={(v) => getSpaceMembersReq.run(currentSpace.id, { username: v })}
                    options={memberOptions}
                    showSearch
                    showArrow={false}
                    filterOption={false}
                    notFoundContent={getSpaceMembersReq.loading ? <Spin size="small" /> : null}
                  />
                }
              >
                <Button icon={<PlusOutlined />} type="primary" shape="circle" />
              </Popover>
            </Space>
          </Card>
        </List.Item>
      )}
    />
  );
};

export default GroupList;
