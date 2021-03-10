import { Badge, InputNumber, Space } from 'antd';
import React from 'react';

const PropertyNumber: React.FC<{
  value: number;
  editable?: boolean;
  onChange?: (v: any) => void;
}> = ({ value, editable = false, onChange = () => {} }) => {
  return editable ? (
    <InputNumber
      value={value}
      onChange={(v) => {
        onChange(v);
      }}
    />
  ) : (
    <Space size={0} wrap align="start">
      <Badge className="badge-priority" count={value} />
    </Space>
  );
};

export default PropertyNumber;
