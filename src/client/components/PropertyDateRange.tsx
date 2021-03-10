import { ArrowRightOutlined } from '@ant-design/icons';
import { DatePicker, Space } from 'antd';
import moment from 'moment';
import React from 'react';

const PropertyDateRange: React.FC<{
  startDate: Date;
  endDate: Date;
  editable?: boolean;
  onChange?: (dates: [Date, Date]) => void;
}> = ({ startDate, endDate, editable = false, onChange = () => {} }) => {
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
