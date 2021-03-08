import React, { useRef, useState } from 'react';
import { useModel, useRequest } from 'umi';
import { Button, Dropdown, Menu, Popconfirm, Typography } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import { getSpaceMembers, removeSpaceMember } from '../member.service';
import VTable from '@components/VTable';
import { GetMembersDTO, MemberRes } from '@dtos/member.dto';

const { Text } = Typography;

const MemberTable: React.FC<{ headers?: any[]; update?: boolean }> = ({ headers = [], update }) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const { currentUser, currentSpace } = initialState;
  const [dataUpdate, setDataUpdate] = useState(false);
  const [viewUpdate, setViewUpdate] = useState(false);
  const [memberList, setMemberList] = useState<MemberRes[]>([]);
  const fetchCountRef = useRef(0);

  const removeSpaceMemberReq = useRequest(removeSpaceMember, {
    manual: true,
    onSuccess: (res) => {
      setDataUpdate(!dataUpdate);
    },
  });

  const columns = headers
    .filter((header) => !header.hidden)
    .map((header) => {
      const type = header.title.split(':')[0];
      switch (type) {
        case 'username':
          return {
            dataIndex: 'username',
            title: '用户名',
            width: header.width,
            render: (_, member: MemberRes) => <span>{member.username}</span>,
          };
        default:
          return undefined;
      }
    })
    .filter((c) => c !== undefined);

  const actionMenu = (member: MemberRes) => (
    <Menu>
      <Menu.Item disabled={memberList.length <= 1} key="1">
        <Popconfirm
          title="你确定要移除该成员么？"
          onConfirm={() => removeSpaceMemberReq.run(currentSpace.id, member.userId)}
          okText="确认"
          cancelText="取消"
        >
          <a href="#">删除</a>
        </Popconfirm>
      </Menu.Item>
    </Menu>
  );

  columns.push({
    dataIndex: 'action',
    title: '操作',
    width: 100,
    render: (_, member: MemberRes) => (
      <Dropdown overlay={actionMenu(member)}>
        <Button icon={<EllipsisOutlined />}></Button>
      </Dropdown>
    ),
  });
  const getMembers = async (body: GetMembersDTO) => {
    const params = {};
    for (const header of headers.filter((header) => !header.hidden)) {
      if (header.filter) {
        switch (header.title) {
          case 'dueAt':
            params['dueBefore'] = header.filter;
            break;

          default:
            params[header.title] = header.filter;
            break;
        }
      }
    }

    return await getSpaceMembers(currentSpace.id, { ...params, ...body });
  };
  const initSpaceMembersReq = useRequest(getMembers, {
    refreshDeps: [update, dataUpdate, headers],
    onSuccess: (res, params) => {
      setMemberList(Array(res.total).fill(undefined));
      if (fetchCountRef.current !== 0) {
        setViewUpdate(!viewUpdate);
      }
      fetchCountRef.current++;
    },
  });

  const getSpaceMembersReq = useRequest(getMembers, {
    manual: true,
    onSuccess: (res, params) => {
      for (let index = params[0].skip; index < params[0].skip + params[0].take; index++) {
        memberList[index] = res.list[index - params[0].skip];
      }
      setMemberList(memberList);
    },
  });

  const loadMoreItems = (startIndex: number, stopIndex: number) => {
    // console.log(startIndex);
    // console.log(stopIndex);
    return getSpaceMembersReq.run({
      skip: startIndex,
      take: stopIndex - startIndex + 1,
    });
  };

  return (
    <VTable
      loading={initSpaceMembersReq.loading}
      update={viewUpdate}
      dataSource={memberList}
      columns={columns}
      loadMoreItems={loadMoreItems}
    />
  );
};
export default MemberTable;
