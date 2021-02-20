import React, { useEffect, useRef, useState } from 'react';
import { Card, Avatar, Space, Typography, Skeleton, Image } from 'antd';
import moment from 'moment';
import { CommentType } from '@server/task/entities/comment.entity';
import { getOssClient } from '../../layout/layout.service';
import { useMount } from 'ahooks';

const { Text, Paragraph } = Typography;

const OssFileCard: React.FC<{ ossObject: string; key?: number; width?: number }> = ({
  ossObject,
  key = '',
  width = 50,
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const mountedRef = useRef<boolean>();

  useEffect(() => {
    mountedRef.current = true;
    getOssClient().then((oss) => {
      if (mountedRef.current) {
        setImageUrl(oss.signatureUrl(ossObject, { expires: 3600 }));
      }
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <Space key={key} direction={'vertical'} align={'center'}>
      <Image
        alt="example"
        style={{ width: width, height: width }}
        src="https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png"
      ></Image>
      <Text
        style={{ wordBreak: 'break-word', width: 100 }}
        ellipsis={{ tooltip: 'I am ellipsis now!' }}
      >
        sdfsefasdfasfasdfasdfasfasdfffasdfasfasdffffasdf.png
      </Text>
    </Space>
  );
};
export default OssFileCard;
