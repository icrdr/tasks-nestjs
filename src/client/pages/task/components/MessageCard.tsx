import React, { useEffect, useRef, useState } from 'react';
import { Card, Avatar, Space, Typography, Skeleton, Image } from 'antd';
import moment from 'moment';
import { CommentType } from '@server/task/entities/comment.entity';
import { getOssClient } from '../../layout/layout.service';
import { useMount } from 'ahooks';

const { Text, Paragraph } = Typography;

const MessageCard: React.FC<{
  onLoad?: Function;
  onTapContent?: Function;
  type?: string;
  author?: string;
  datetime?: Date;
  isMe?: boolean;
  isLoading?: boolean;
  avatar?: string;
  content?: string;
}> = ({
  onLoad = () => {},
  onTapContent = () => {},
  type = 'text',
  author = 'user',
  datetime = new Date(),
  content = '',
  avatar = '',
  isMe = false,
  isLoading = false,
}) => {
  // const [imageUrl, setImageUrl] = useState(null);
  // const mountedRef = useRef<boolean>();

  // useEffect(() => {
  //   mountedRef.current = true;
  //   if (type === 'image') {
  //     getOssClient().then((oss) => {
  //       if (mountedRef.current) {
  //         setImageUrl(oss.signatureUrl(content, { expires: 3600 }));
  //       }
  //     });
  //   }
  //   return () => {
  //     mountedRef.current = false;
  //   };
  // }, [type]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
        paddingBottom: '20px',
      }}
    >
      <div style={{ order: isMe ? 2 : 0, flexShrink: 0, marginRight: isMe ? 0 : '8px' }}>
        {isLoading ? (
          <Skeleton.Avatar size="default" active />
        ) : (
          <Avatar src={avatar}>{author}</Avatar>
        )}
      </div>
      <div
        style={{
          order: isMe ? 0 : 3,
          flexShrink: 0,
          width: '32px',
          marginRight: isMe ? '8px' : 0,
        }}
      />
      <div style={{ order: 1, flexGrow: 1, marginRight: '8px' }}>
        <div
          style={{
            justifyContent: isMe ? 'flex-end' : 'flex-start',
            display: 'flex',
          }}
        >
          <Card
            className={isMe ? 'chat-message-card-me' : 'chat-message-card-other'}
            style={{ width: 'auto', maxWidth: '400px' }}
            bodyStyle={{ padding: '10px', wordBreak: 'break-word' }}
          >
            {isLoading ? (
              <Skeleton paragraph={{ rows: 1, width: '160px' }} title={false} active />
            ) : type === 'image' ? (
              <a onClick={() => onTapContent()}>
                <img
                  src={content}
                  // style={{ height: !content ? '150px' : '100%', maxHeight: '150px' }}
                  height={150}
                  // @ts-ignore
                  onLoad={onLoad}
                />
              </a>
            ) : (
              <Space direction="vertical" size={0} align={isMe ? 'end' : 'start'}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {!isMe && author} {moment(datetime).fromNow()}
                </Text>
                <Space direction="vertical" size={0}>
                  {content?.split(/(\r\n|\n|\r)/gm).map((p, i) => (
                    <Text key={i}>{p}</Text>
                  ))}
                </Space>
              </Space>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
export default MessageCard;
