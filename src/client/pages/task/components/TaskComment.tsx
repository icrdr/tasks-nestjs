import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Comment,
  Button,
  Card,
  Form,
  Input,
  List,
  Mentions,
  Avatar,
  Popover,
  Space,
  Alert,
  Typography,
  message,
} from 'antd';
import Cookies from 'js-cookie';
import { CommentDTO, CommentRes } from '@dtos/task.dto';
import useWebSocket from '@hooks/useWebSocket';
import { useModel, useRequest } from 'umi';
import { getSpaceMembers } from '../../member/member.service';
import { MemberRes } from '@dtos/space.dto';
import {
  FileImageOutlined,
  MessageOutlined,
  PictureOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { Picker } from 'emoji-mart';
import { getTaskComments } from '../task.service';
import { CommentType } from '@server/task/entities/comment.entity';
import ReplyMessage from './ReplyMessage';
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  InfiniteLoader,
  WindowScroller,
} from 'react-virtualized';
import VList from 'react-virtualized/dist/commonjs/List';
import { useSize, useThrottleEffect } from 'ahooks';
import { sleep } from '@utils/utils';
const { Text, Link } = Typography;

const TaskComment = ({ taskId }, ref) => {
  const { initialState } = useModel('@@initialState');
  const { currentUser, currentSpace } = initialState;
  const commentListEle = useRef(null);
  const vListRef = useRef<VList>(null);
  const [form] = Form.useForm();
  // const [commentList, setCommentList] = useState<CommentRes[]>([]);
  const [commentListMap, setCommentListMap] = useState(new Map<number, CommentRes>());
  const [commentCount, setCommentCount] = useState(0);
  const [memberList, setMemberList] = useState<MemberRes[]>([]);
  const commentCountRef = useRef<number>();
  const [first, setFirst] = useState(false);
  commentCountRef.current = commentCount;
  // const size = useSize(commentListEle)
  useRequest(() => getTaskComments(taskId), {
    onSuccess: async (res) => {
      console.log(res);
      setCommentCount(res.total);
      // scrollToBottom();
    },
  });

  const recomputeRowHeights = () => {
    cache.clearAll();
    vListRef.current.recomputeRowHeights();
  };

  const scrollToBottom = async () => {
    vListRef.current.scrollToRow(commentCountRef.current);
  };

  useImperativeHandle(ref, () => ({
    recomputeRowHeights,
  }));

  const getCommentsReq = useRequest(getTaskComments, {
    debounceInterval: 1000,
    ready: !first,
    manual: true,
    onSuccess: (res, params) => {
      for (let index = 0; index < params[1].take; index++) {
        commentListMap.set(index + params[1].skip, res.list[index]);
      }
      console.log(res.list);
      console.log(commentListMap);
      setCommentListMap(commentListMap);
      setCommentCount(res.total);
      recomputeRowHeights();
      console.log(params[1].skip + params[1].take);
      console.log(res.total);
      if (params[1].skip + params[1].take === res.total) {
        scrollToBottom();
        setFirst(true);
      }
    },
  });

  const getSpaceMembersReq = useRequest(getSpaceMembers, {
    debounceInterval: 1000,
    manual: true,
    onSuccess: (res) => {
      // console.log(res);
      setMemberList(res.list);
    },
  });

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
    onMessage: (msg: WebSocketEventMap['message']) => {
      const data = JSON.parse(msg.data);
      console.log(data);
      if (!data.status) {
        commentListMap.set(commentCountRef.current, data);
        setCommentListMap(commentListMap);
        setCommentCount(commentCountRef.current + 1);
        recomputeRowHeights();
        if (data.sender.id === currentUser.id) {
          scrollToBottom();
        }
      } else {
        message.error(data.message);
      }
    },
  });

  // const handleScrollDown = () => {
  //   if (
  //     commentListEle.current.scrollTop + 200 >
  //     commentListEle.current.scrollHeight - commentListEle.current.clientHeight
  //   )
  //     commentListEle.current.scrollTop = commentListEle.current.scrollHeight;
  // };

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
    // commentListEle.current.scrollTop = commentListEle.current.scrollHeight;
  };

  const handleEmojiSelete = (emoji) => {
    const preValue = form.getFieldsValue();
    preValue.content = preValue.content ? preValue.content + emoji.native : emoji.native;
    form.setFieldsValue(preValue);
  };
  const contentRule = [
    {
      required: true,
      message: '必填',
    },
  ];

  function isRowLoaded({ index }) {
    return !!commentListMap.get(index);
  }

  function loadMoreRows({ startIndex, stopIndex }) {
    console.log(startIndex);
    console.log(stopIndex);
    return getCommentsReq.run(taskId, { skip: startIndex, take: stopIndex - startIndex + 1 });
  }
  const cache = new CellMeasurerCache({
    defaultHeight: 82,
    minHeight: 82,
    fixedWidth: true,
  });
  function rowRenderer({ key, index, style, parent }) {
    const comment = commentListMap.get(index);
    return (
      <CellMeasurer cache={cache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
        {({ registerChild }) => (
          <div ref={registerChild} style={{ ...style }}>
            <ReplyMessage
              type={comment?.type}
              isMe={comment?.sender?.id === currentUser.id}
              isLoading={!comment}
              author={comment?.sender?.username}
              datetime={comment?.createAt}
              avatar={comment?.sender?.username}
              content={comment?.content}
            />
          </div>
        )}
      </CellMeasurer>
    );
  }

  const infiniteLoader = (
    <InfiniteLoader
      isRowLoaded={isRowLoaded}
      loadMoreRows={loadMoreRows}
      threshold={1}
      rowCount={commentCount}
    >
      {({ onRowsRendered, registerChild }) => (
        <AutoSizer>
          {({ width, height }) => (
            <VList
              style={{ outline: 'none', padding: '20px 10px' }}
              ref={(ref) => {
                vListRef.current = ref;
                registerChild(ref);
              }}
              height={height}
              width={width}
              rowCount={commentCount}
              rowHeight={cache.rowHeight}
              rowRenderer={rowRenderer}
              onRowsRendered={onRowsRendered}
              overscanRowCount={1}
              estimatedRowSize={82}
              deferredMeasurementCache={cache}
              scrollToIndex={commentCount}
            />
          )}
        </AutoSizer>
      )}
    </InfiniteLoader>
  );

  return (
    <div ref={commentListEle} style={{ height: '100%', minWidth: '250px', position: 'relative' }}>
      <Card
        bordered={false}
        style={{ height: 'calc(100vh - 300px)' }}
        bodyStyle={{ height: '100%', padding: 0 }}
      >
        {infiniteLoader}
      </Card>
      <Form form={form} onFinish={handleSend}>
        <div style={{ padding: '10px 0', width: '100%' }}>
          <Space>
            <Popover trigger={'click'} content={'upload'}>
              <Button icon={<PictureOutlined />} />
            </Popover>
            <Popover
              trigger={'click'}
              content={
                <Picker
                  set="apple"
                  showPreview={false}
                  showSkinTones={false}
                  onSelect={(emoji) => handleEmojiSelete(emoji)}
                />
              }
            >
              <Button icon={<SmileOutlined />} />
            </Popover>
          </Space>
          <Button style={{ float: 'right' }} type="primary" htmlType="submit">
            发送
          </Button>
        </div>
        <Form.Item name="content" rules={contentRule}>
          <Mentions
            style={{ width: '100%' }}
            loading={getSpaceMembersReq.loading}
            autoSize={{ minRows: 4, maxRows: 8 }}
            onSearch={(text) => {
              console.log('text');
              getSpaceMembersReq.run(currentSpace.id, { username: text });
            }}
          >
            {memberList.map((member) => (
              <Mentions.Option key={member.userId.toString()} value={member.username}>
                <span>{member.username}</span>
              </Mentions.Option>
            ))}
          </Mentions>
        </Form.Item>
      </Form>
      <Button
        onClick={() => {
          // vListRef.current.scrollToRow(commentCount);
          cache.clearAll();
          vListRef.current.recomputeRowHeights();
        }}
      >
        resize
      </Button>
      <Button
        onClick={() => {
          vListRef.current.scrollToRow(commentCount);
        }}
      >
        vvv
      </Button>
    </div>
  );
};
export default forwardRef(TaskComment);
