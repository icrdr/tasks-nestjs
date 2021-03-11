import { ArrowRightOutlined } from '@ant-design/icons';
import { DatePicker, Space } from 'antd';
import moment from 'moment';
import React from 'react';

const PropertyDate: React.FC<{
  value: Date;
  editable?: boolean;
  onChange?: (date: Date) => void;
}> = ({ value, editable = false, onChange = () => {} }) => {
  return editable ? (
    <DatePicker
      value={value ? moment(value) : undefined}
      onChange={(date) => {
        if (!date) {
          onChange(null);
        } else {
          onChange(date.toDate());
        }
      }}
    />
  ) : (
    <span>{`${value ? moment(value).format('YYYY/MM/DD') : '/'}`}</span>
  );
};

export default PropertyDate;
