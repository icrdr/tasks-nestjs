import React from 'react';
import { PropertyRes } from '@dtos/property.dto';
import PropertyString from './PropertyString';
import PropertyNumber from './PropertyNumber';
import PropertySelect from './PropertySelect';
import PropertyRadio from './PropertyRadio';
import { Badge, DatePicker, Input, Select, Space, Spin } from 'antd';
import moment from 'moment';
import { RoleRes } from '@dtos/role.dto';
import FilterDateRange from './FilterDateRange';
import FilterSelect from './FilterSelect';
import FilterString from './FilterString';

const HeaderFilter: React.FC<{
  headers?: any[];
  roles?: RoleRes[];
  properties?: PropertyRes[];
  memberOptions?: { label: string; value: string }[];
  onChange?: (index: number, v: any) => void;
  onSearchMember?: (v: any) => void;
  filterRender?: (type: string, filter: any, index: number, onChange: Function) => React.ReactNode;
  serachMemberLoading?: boolean;
}> = ({
  headers = [],
  roles = [],
  properties = [],
  memberOptions = [],
  onChange = () => {},
  onSearchMember = () => {},
  filterRender = (type, filter, index) => <div key={index}></div>,
  serachMemberLoading = false,
}) => {
  return (
    <Space wrap>
      {headers.map((header, index: number) => {
        const type = header.title.split(':')[0];
        if (header.hidden) return false;
        switch (type) {
          case 'role':
            const role = roles.filter((r) => r.id === parseInt(header.title.split(':')[1]))[0];
            return (
              <Select
                key={index}
                style={{ width: 100 }}
                placeholder={role.name}
                defaultValue={header.filter || undefined}
                onChange={(v) => onChange(index, v)}
                onSearch={onSearchMember}
                options={memberOptions}
                showSearch
                showArrow={false}
                filterOption={false}
                notFoundContent={serachMemberLoading ? <Spin size="small" /> : null}
                allowClear
              />
            );
          case 'prop':
            const property = properties.filter(
              (p) => p.id === parseInt(header.title.split(':')[1]),
            )[0];
            switch (property?.form) {
              case 'string':
                return (
                  <FilterString
                    key={index}
                    placeholder={property.name}
                    onChange={(v) => onChange(index, v)}
                    value={header.filter || undefined}
                  />
                );
              case 'select':
                return (
                  <FilterSelect
                    key={index}
                    placeholder={property.name}
                    value={header.filter || undefined}
                    onChange={(v) => onChange(index, v)}
                    options={
                      property.items
                        ? Object.entries(property.items).map(
                            (item: [string, { color: string }]) => {
                              return { label: item[0], value: item[0] };
                            },
                          )
                        : []
                    }
                  />
                );
            }
          default:
            return filterRender(type, header.filter, index, onChange);
        }
      })}
    </Space>
  );
};

export default HeaderFilter;
