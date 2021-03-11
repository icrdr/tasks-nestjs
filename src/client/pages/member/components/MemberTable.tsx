import React, { useEffect, useRef, useState } from 'react';
import { useModel, useRequest } from 'umi';
import { Button, Dropdown, Menu, Popconfirm, Typography } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import { changeSpaceMember, getSpaceMembers, removeSpaceMember } from '../member.service';
import VTable from '@components/VTable';
import { GetMembersDTO, MemberRes } from '@dtos/member.dto';
import { PropertyRes } from '@dtos/property.dto';
import PropertyItem from '../../../components/PropertyItem';

const MemberTable: React.FC<{ headers?: any[]; update?: boolean }> = ({ headers = [], update }) => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const { currentUser, currentSpace } = initialState;
  const [thisUpdate, setThisUpdate] = useState(false);
  const [childUpdate, setChildUpdate] = useState(false);
  const vTableRef = useRef(null);

  const headersToColumns = (headers: any[], properties: PropertyRes[]) => {
    const _column = headers
      .filter((header) => !header.hidden)
      .map((header) => {
        const type = header.title.split(':')[0];
        switch (type) {
          case 'username':
            return {
              title: '用户名',
              width: header.width,
              itemRender: (member: MemberRes) => <span>{member.username}</span>,
            };
          case 'prop':
            const property = properties.filter(
              (p) => p.id === parseInt(header.title.split(':')[1]),
            )[0];
            return property
              ? {
                  title: property.name,
                  width: header.width,
                  itemRender: (member: MemberRes, columnIndex, rowIndex) => {
                    const value = member.properties
                      ? member.properties['prop' + property.id]?.toString()
                      : undefined;
                    return (
                      <PropertyItem
                        property={property}
                        value={value}
                        editable={true}
                        onChange={(v) => {
                          const properties = member.properties || {};
                          properties['prop' + property.id] = v;
                          changeSpaceMemberReq.run(
                            currentSpace.id,
                            member.userId,
                            { properties },
                            rowIndex,
                          );
                        }}
                      />
                    );
                  },
                }
              : undefined;
        }
      })
      .filter((c) => c !== undefined);

    const actionMenu = (member: MemberRes) => (
      <Menu>
        <Menu.Item disabled={vTableRef.current?.items.length <= 1} key="delete">
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

    _column.push({
      title: '操作',
      width: 50,
      itemRender: (member: MemberRes) => (
        <Dropdown overlay={actionMenu(member)}>
          <Button icon={<EllipsisOutlined />}></Button>
        </Dropdown>
      ),
    });
    return _column;
  };

  const [columns, setColumns] = useState(headersToColumns(headers, currentSpace.memberProperties));

  useEffect(() => {
    setColumns(headersToColumns(headers, currentSpace.memberProperties));
    setChildUpdate(!childUpdate);
  }, [update]);

  const removeSpaceMemberReq = useRequest(removeSpaceMember, {
    manual: true,
    onSuccess: (res) => {
      setChildUpdate(!childUpdate);
    },
  });

  const changeSpaceMemberWithRowIndex = (id, userId, body, index) => {
    return changeSpaceMember(id, userId, body);
  };
  const changeSpaceMemberReq = useRequest(changeSpaceMemberWithRowIndex, {
    manual: true,
    onSuccess: (res, params) => {
      vTableRef.current.setRowItem(params[2], res);
    },
  });

  const getMembers = async (body: GetMembersDTO) => {
    const params = {};
    for (const header of headers.filter((header) => !header.hidden)) {
      if (header.filter) params[header.title] = header.filter;
    }
    return await getSpaceMembers(currentSpace.id, { ...params, ...body });
  };

  return <VTable ref={vTableRef} request={getMembers} update={childUpdate} columns={columns} />;
};
export default MemberTable;
