import { Badge, InputNumber } from "antd";
import React from "react";

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
    <Badge className="badge-priority" count={value} />
  );
};

export default PropertyNumber;
