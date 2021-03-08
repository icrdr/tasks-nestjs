import React, { useEffect } from 'react';
import { Typography } from 'antd';

const { Text, Paragraph } = Typography;

const Test: React.FC<{ update? }> = ({ update = false }) => {
  useEffect(() => {
    console.log('rebuilding');
  }, [update]);

  return <div>asdfasdf</div>;
};
//@ts-ignore
export default Test;
