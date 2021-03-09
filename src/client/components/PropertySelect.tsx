import { Select, Tag } from "antd";
import React from "react";

const PropertySelect: React.FC<{
  items: any;
  value: string;
  editable?: boolean;
  onChange?: (v: any) => void;
}> = ({ items, value, editable = false, onChange = () => {} }) => {
  return editable ? (
    <Select
      style={{ width: "100%" }}
      mode="multiple"
      value={value ? value.split(",") : undefined}
      onChange={(v) => {
        onChange(v.join(","));
      }}
      options={Object.entries(items).map(
        (item: [string, { color: string }]) => {
          return { label: item[0], value: item[0] };
        }
      )}
      allowClear
    />
  ) : (
    <>
      {value?.split(",").map((v, i) => (
        <Tag key={i} color={items[v]?.color}>
          {v}
        </Tag>
      ))}
    </>
  );
};

export default PropertySelect;
