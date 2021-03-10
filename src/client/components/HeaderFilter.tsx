import React from "react";
import { PropertyRes } from "@dtos/property.dto";
import PropertyString from "./PropertyString";
import PropertyNumber from "./PropertyNumber";
import PropertySelect from "./PropertySelect";
import PropertyRadio from "./PropertyRadio";
import { Badge, DatePicker, Input, Select, Space, Spin } from "antd";
import moment from "moment";
import { RoleRes } from "@dtos/role.dto";

const HeaderFilter: React.FC<{
  headers: any[];
  roles?: RoleRes[];
  properties?: PropertyRes[];
  memberOptions?: { label: string; value: string }[];
  onChange?: (index: number, v: any) => void;
  onSearchMember?: (v: any) => void;
  serachMemberLoading?: boolean;
}> = ({
  headers,
  roles = [],
  properties = [],
  memberOptions = [],
  onChange = () => {},
  onSearchMember = () => {},
  serachMemberLoading = false,
}) => {
  return (
    <Space wrap>
      {headers
        ?.filter((header) => !header.hidden)
        .map((header, index: number) => {
          const type = header.title.split(":")[0];
          switch (type) {
            case "username":
              return (
                <Input.Search
                  key={index}
                  style={{ width: 120 }}
                  placeholder="用户名"
                  onSearch={(v) => onChange(index, v)}
                  defaultValue={header.filter || ""}
                  allowClear
                />
              );
            case "name":
              return (
                <Input.Search
                  key={index}
                  style={{ width: 120 }}
                  placeholder="名称"
                  onSearch={(v) => onChange(index, v)}
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
                  onChange={(v) => onChange(index, v)}
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
                  style={{ width: 120 }}
                  placeholder={"死线之前"}
                  defaultValue={
                    header.filter ? moment(header.filter) : undefined
                  }
                  onChange={(v) => onChange(index, v?.toDate() || undefined)}
                />
              );
            case "createAt":
              return (
                <DatePicker
                  key={index}
                  placeholder={"创建之前"}
                  defaultValue={
                    header.filter ? moment(header.filter) : undefined
                  }
                  onChange={(v) => onChange(index, v?.toDate() || undefined)}
                />
              );
            case "format":
              return (
                <Input.Search
                  key={index}
                  style={{ width: 120 }}
                  placeholder="格式"
                  onSearch={(v) => onChange(index, v)}
                  defaultValue={header.filter || ""}
                  allowClear
                />
              );
            case "role":
              const role = roles.filter(
                (r) => r.id === parseInt(header.title.split(":")[1])
              )[0];
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
                  notFoundContent={
                    serachMemberLoading ? <Spin size="small" /> : null
                  }
                  allowClear
                />
              );
            case "prop":
              const property = properties.filter(
                (p) => p.id === parseInt(header.title.split(":")[1])
              )[0];
              switch (property?.form) {
                case "string":
                  return (
                    <Input.Search
                      key={index}
                      style={{ width: 120 }}
                      placeholder={property.name}
                      defaultValue={header.filter || undefined}
                      onSearch={(v) => onChange(index, v)}
                      allowClear
                    />
                  );
                case "select":
                  return (
                    <Select
                      key={index}
                      style={{ width: 100 }}
                      placeholder={property.name}
                      defaultValue={header.filter || undefined}
                      onChange={(v) => onChange(index, v)}
                      allowClear
                    >
                      {property.items &&
                        Object.entries(property.items).map(
                          (item: [string, { color: string }]) => {
                            return (
                              <Select.Option key={item[0]} value={item[0]}>
                                {item[0]}
                              </Select.Option>
                            );
                          }
                        )}
                    </Select>
                  );
              }
            default:
              <div></div>;
          }
        })}
    </Space>
  );
};

export default HeaderFilter;
