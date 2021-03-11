import { EditOutlined } from '@ant-design/icons';
import { Button, Input, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { Link } from 'umi';
const { Text } = Typography;

const PropertyString: React.FC<{
  value: string;
  editable?: boolean;
  link?: string;
  onChange?: (v: any) => void;
}> = ({ value, link, editable = false, onChange = () => {} }) => {
  const [_value, setValue] = useState(value);
  useEffect(() => {
    console.log(value);
    setValue(_value);
  }, [value]);
  return editable ? (
    <Input
      value={_value}
      onChange={(e) => setValue(e.currentTarget.value)}
      onPressEnter={(e) => {
        e.preventDefault();
        const v = e.currentTarget.value;
        onChange(v);
      }}
    />
  ) : (
    <span>{link ? <Link to={link}>{value}</Link> : <span>{value}</span>}</span>
  );
};

export default PropertyString;
