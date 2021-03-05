import React, { useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { history, useModel, useRequest } from 'umi';
import { Button, Card, Form, Input, Select, Space, Table, Typography } from 'antd';
import { GetMembersDTO, MemberRes, RoleRes } from '@dtos/space.dto';
import { useForm } from 'antd/es/form/Form';
import { EditOutlined, HighlightOutlined } from '@ant-design/icons';
import { getSpaceMembers } from '../member.service';
import VTable from '@components/VTable';
import { ViewOption } from '@server/common/common.entity';

const { Text } = Typography;

const MemberTable: React.FC<{ option: ViewOption; update?: boolean }> = ({ option, update }) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const { currentUser, currentSpace } = initialState;
  const [dataUpdate, setDataUpdate] = useState(false);
  const [viewUpdate, setViewUpdate] = useState(false);
  const [memberList, setMemberList] = useState<MemberRes[]>([]);
  const fetchCountRef = useRef(0);

  const columns = option.headers
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

  const getMembers = async (body: GetMembersDTO) => {
    const params = {};
    for (const header of option.headers.filter((header) => !header.hidden)) {
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
    refreshDeps: [update, dataUpdate, option],
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
    console.log(startIndex);
    console.log(stopIndex);
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
