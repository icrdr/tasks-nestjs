import React, { useRef, useState } from 'react';
import { Button, Card, Form, Input } from 'antd';
import Cookies from 'js-cookie';
import { CommentDTO, CommentRes } from '@dtos/task.dto';
import useWebSocket from '@hooks/useWebSocket';
// import { CommentType } from '@server/task/entities/comment.entity';

const TaskDiscuss: React.FC<{
  taskId: number;
}> = ({ taskId }) => {
  const [form] = Form.useForm();
  const [commentList, setCommentList] = useState<CommentRes[]>([]);
  const commentListRef = useRef([]);
  commentListRef.current = commentList;

  const {
    readyState,
    sendMessage,
    latestMessage,
    disconnect,
    connect,
    webSocketIns,
  } = useWebSocket(`ws://localhost:3000?target=discuss&taskId=${taskId}`, {
    reconnectInterval: 1000,
    protocols: Cookies.get('token'),
    onMessage: (message: WebSocketEventMap['message']) => {
      const data = JSON.parse(message.data);
      console.log(data);
      setCommentList([...commentListRef.current, data]);
      console.log(commentListRef.current);
    },
  });

  const handleSend = (values) => {
    console.log(values);
    const data = {
      taskId: taskId,
      content: values.content,
      type: 'text',
    };

    const sendData = JSON.stringify({ event: 'comment', data });
    sendMessage(sendData);
    form.resetFields();
  };

  return (
    <Card style={{ padding: 10, width: '300px', height: '1000px' }}>
      {commentList.map((item, index) => {
        return <Card key={index}>{item.content}</Card>;
      })}
      <Form form={form} onFinish={handleSend}>
        <Form.Item
          name="content"
          // rules={[{ required: true, comment: 'Please input your username!' }]}
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
export default TaskDiscuss;
