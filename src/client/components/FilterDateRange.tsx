import { ArrowRightOutlined } from '@ant-design/icons';
import { DatePicker, Space } from 'antd';
import moment from 'moment';
import React from 'react';

const FilterDateRange: React.FC<{
  placeholder?: [string, string];
  value?: [Date?, Date?];
  onChange?: (dates: [Date, Date]) => void;
}> = ({ value, placeholder, onChange = () => {} }) => {
  const startDate = value ? value[0] || undefined : undefined;
  const endDate = value ? value[1] || undefined : undefined;
  return (
    <DatePicker.RangePicker
      style={{ width: 200 }}
      placeholder={placeholder}
      ranges={{
        今天: [moment(), moment()],
        本周: [
          moment().week(moment().week()).startOf('week'),
          moment().week(moment().week()).endOf('week'),
        ],
        本月: [
          moment().month(moment().month()).startOf('month'),
          moment().month(moment().month()).endOf('month'),
        ],
      }}
      value={[startDate ? moment(startDate) : undefined, endDate ? moment(endDate) : undefined]}
      onChange={(dates) => {
        if (!dates) {
          onChange(undefined);
        } else {
          onChange([dates[0]?.toDate(), dates[1]?.toDate()]);
        }
      }}
    />
  );
};

export default FilterDateRange;
