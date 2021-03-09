import { Select, Tag } from "antd";
import React from "react";

const PropertyRadio: React.FC<{
  items: any;
  value: string;
  editable?: boolean;
  onChange?: (v: any) => void;
}> = ({ items, value, editable = false, onChange = () => {} }) => {
  return editable ? (
    <Select
      style={{ width: "100%" }}
      value={value}
      onChange={(v) => {
        onChange(v);
      }}
      allowClear
    >
      {items &&
        Object.entries(items).map((item: [string, { color: string }]) => {
          return (
            <Select.Option key={item[0]} value={item[0]}>
              {item[0]}
            </Select.Option>
          );
        })}
    </Select>
  ) : (
    <Tag color={items[value]?.color}>{value}</Tag>
  );
};

export default PropertyRadio;
