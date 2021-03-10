import { EditOutlined } from '@ant-design/icons';
import { Button, Input, Typography } from 'antd';
import React, { useState } from 'react';
const { Text } = Typography;

const PropertyString: React.FC<{
  value: string;
  editable?: boolean;
  onChange?: (v: any) => void;
}> = ({ value, editable = false, onChange = () => {} }) => {
  const [isEditing, setEditing] = useState(false);
  return isEditing ? (
    <Input
      defaultValue={value}
      onPressEnter={(e) => {
        e.preventDefault();
        const v = e.currentTarget.value;
        setEditing(false);
        onChange(v);
      }}
    />
  ) : (
    <span>
      {editable && (
        <Button type={'link'} icon={<EditOutlined />} onClick={() => setEditing(true)} />
      )}
      {value}
    </span>
  );
};

export default PropertyString;
