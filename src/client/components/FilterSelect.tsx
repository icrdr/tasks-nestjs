import { Select } from 'antd';
import React from 'react';

const FilterSelect: React.FC<{
  options?: { label: string; value: string; color?: string }[];
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
}> = ({ value, placeholder, options = [], onChange = () => {} }) => {
  return (
    <Select
      style={{ width: 100 }}
      placeholder={placeholder}
      value={value}
      onChange={(v) => onChange(v)}
      options={options}
      allowClear
    />
  );
};

export default FilterSelect;
