import { Typography } from "antd";
import React from "react";
const { Text } = Typography;

const PropertyString: React.FC<{
  value: string;
  editable?: boolean;
  onChange?: (v: any) => void;
}> = ({ value, editable = false, onChange = () => {} }) => {
  return (
    <Text
      editable={
        editable
          ? {
              onChange: (v) => {
                onChange(v);
              },
            }
          : false
      }
    >
      {value}
    </Text>
  );
};

export default PropertyString;
