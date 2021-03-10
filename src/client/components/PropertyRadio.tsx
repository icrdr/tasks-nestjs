import { Select, Space, Tag } from 'antd';
import React from 'react';

const PropertyRadio: React.FC<{
  options: { label: string; value: string; color?: string }[];
  value: string;
  editable?: boolean;
  onChange?: (v: any) => void;
}> = ({ options, value, editable = false, onChange = () => {} }) => {
  const optionColorMap = new Map();
  for (const option of options) {
    optionColorMap.set(option.value, option.color);
  }
  return editable ? (
    <Select
      style={{ minWidth: '100px' }}
      value={value}
      onChange={(v) => {
        onChange(v);
      }}
      options={options}
      allowClear
    />
  ) : (
    <Space size={0} wrap align="start">
      <Tag color={optionColorMap.get(value)?.color || 'blue'}>{value}</Tag>
    </Space>
  );
};

export default PropertyRadio;
