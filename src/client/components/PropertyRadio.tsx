import { Badge, Select, Space, Tag } from 'antd';
import React from 'react';

const PropertyRadio: React.FC<{
  options: { label: string; value: string; color?: string; status?: string }[];
  value: string;
  editable?: boolean;
  mode?: 'tag' | 'badge';
  onChange?: (v: any) => void;
}> = ({ options, value, editable = false, mode = 'tag', onChange = () => {} }) => {
  const optionDataMap = new Map();
  for (const option of options) {
    optionDataMap.set(option.value, option);
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
      {mode === 'tag' && <Tag color={optionDataMap.get(value)?.color || 'blue'}>{value}</Tag>}
      {mode === 'badge' && (
        <Badge
          status={optionDataMap.get(value)?.status || 'default'}
          text={optionDataMap.get(value)?.label}
        />
      )}
    </Space>
  );
};

export default PropertyRadio;
