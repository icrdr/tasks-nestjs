import { ArrowRightOutlined } from '@ant-design/icons';
import { DatePicker, Space } from 'antd';
import moment from 'moment';
import React from 'react';

const PropertyDateRange: React.FC<{
  value: [Date?, Date?];
  editable?: boolean;
  onChange?: (dates: [Date, Date]) => void;
}> = ({ value, editable = false, onChange = () => {} }) => {
  const startDate = value[0];
  const endDate = value[1];
  return editable ? (
    <DatePicker.RangePicker
      ranges={{
        下周: [moment(), moment().add(7, 'd')],
      }}
      value={[startDate ? moment(startDate) : undefined, endDate ? moment(endDate) : undefined]}
      onChange={(dates) => {
        if (!dates) {
          onChange([null, null]);
        } else {
          onChange([dates[0]?.toDate(), dates[1]?.toDate()]);
        }
      }}
    />
  ) : (
    <Space size="small">
      <span>{`${startDate ? moment(startDate).format('YYYY/MM/DD') : '/'}`}</span>
      <ArrowRightOutlined />
      <span>{`${endDate ? moment(endDate).format('YYYY/MM/DD') : '/'}`}</span>
    </Space>
  );
};

export default PropertyDateRange;
