import { Select, Space, Tag } from 'antd';
import React from 'react';

const PropertySelect: React.FC<{
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
      mode="multiple"
      value={value ? value.split(',') : undefined}
      onChange={(v) => {
        onChange(v.length > 0 ? v.join(',') : null);
      }}
      options={options}
      allowClear
    />
  ) : (
    <Space size={0} wrap align="start">
      {value?.split(',').map((v, i) => (
        <Tag key={i} color={optionColorMap.get(v)?.color || 'blue'}>
          {v}
        </Tag>
      ))}
    </Space>
  );
};

export default PropertySelect;
