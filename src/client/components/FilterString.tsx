import { Input } from 'antd';
import React from 'react';

const FilterString: React.FC<{
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
}> = ({ value, placeholder, onChange = () => {} }) => {
  return (
    <Input.Search
      style={{ width: 120 }}
      placeholder={placeholder}
      onSearch={(v) => onChange(v)}
      value={value}
      allowClear
    />
  );
};

export default FilterString;
