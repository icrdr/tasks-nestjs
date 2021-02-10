import React from 'react';
import { Card, Avatar, Space, Typography, Skeleton } from 'antd';
import moment from 'moment';
import { CommentType } from '@server/task/entities/comment.entity';

const { Text } = Typography;

const ReplyMessage: React.FC<{
  type?: CommentType;
  author?: string;
  datetime?: Date;
  isMe?: boolean;
  isLoading?: boolean;
  avatar?: string;
  content?: string;
}> = ({
  // type = CommentType.TEXT,
  author = 'user',
  datetime = new Date(),
  content = '',
  avatar = '',
  isMe = false,
  isLoading = false,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
        padding: '8px 0',
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
            ) : (
              <Space direction="vertical" size={0} align={isMe ? 'end' : 'start'}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {!isMe && author} {moment(datetime).fromNow()}
                </Text>
                <Text>{content}</Text>
              </Space>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
export default ReplyMessage;
