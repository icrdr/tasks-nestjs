import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Button, Card, Form, Mentions, Popover, Space, message, Upload, Image } from 'antd';
import Cookies from 'js-cookie';
import { CommentRes } from '@dtos/task.dto';
import useWebSocket from '@hooks/useWebSocket';
import { useModel, useRequest } from 'umi';
import { getSpaceMembers } from '../../member/member.service';
import { MemberRes } from '@dtos/space.dto';
import {
  LoadingOutlined,
  MessageOutlined,
  PictureOutlined,
  PlusOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { Picker } from 'emoji-mart';
import { getTaskComments } from '../task.service';
import MessageCard from './MessageCard';
import { useInterval } from 'ahooks';
import { getBase64, sleep } from '@utils/utils';
import moment from 'moment';
import { getOssClient } from '../../layout/layout.service';
import { RcFile } from 'antd/lib/upload';
import FsLightbox from '@components/fslightbox';
import { VariableSizeList, FixedSizeList, DynamicSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

const TaskComment = ({ taskId }, ref) => {
  const { initialState } = useModel('@@initialState');
  const { currentUser, currentSpace } = initialState;

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [form] = Form.useForm();
  const [lightBoxSlide, setLightBoxSlide] = useState(0);
  const [lightBoxToggle, setLightBoxToggle] = useState(false);
  const [lightBoxUpdate, setLightBoxUpdate] = useState(0);
  const [commentList, setCommentList] = useState<CommentRes[]>([]);
  const [isUploading, setUploading] = useState(false);
  const [afterFirstFetch, setAfterFirstFetch] = useState(false);
  const [memberList, setMemberList] = useState<MemberRes[]>([]);
  const [scrollInterval, setScrollInterval] = useState(null);
  const [scrollTargetIndex, setScrollTargetIndex] = useState(0);
  const scrollTargetIndexRef = useRef<number>();
  const afterFirstFetchRef = useRef<boolean>();
  const commentListRef = useRef(null);
  commentListRef.current = commentList;
  scrollTargetIndexRef.current = scrollTargetIndex;
  afterFirstFetchRef.current = afterFirstFetch;

  useRequest(() => getTaskComments(taskId), {
    ready: !!taskId,
    onSuccess: (res) => {
      setCommentList(Array(res.total).fill(undefined));
      // scrollToBottom();
    },
  });

  const recomputeRowHeights = () => {
    // cache.clearAll();
    // ListRef.current.recomputeRowHeights();
  };

  const scrollToDate = (date: Date) => {
    getTaskComments(taskId, { dateAfter: date }).then((res) => {
      console.log(res.list[0].index);
      virtuosoRef.current.scrollToIndex(res.list[0].index);
    });
  };

  const scrollToBottom = () => {
    console.log('to');
    virtuosoRef.current.scrollToIndex(commentListRef.current.length - 1);
  };

  useImperativeHandle(ref, () => ({
    recomputeRowHeights,
    scrollToDate,
    scrollToBottom,
  }));

  const getCommentsReq = useRequest(getTaskComments, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
      for (const comment of res.list) {
        if (!commentListRef.current[comment.index]) commentListRef.current[comment.index] = comment;
      }
      setCommentList(commentList);
      setLightBoxUpdate(lightBoxUpdate + 1);
      recomputeRowHeights();
      if (res.list[res.list.length - 1].index === res.total - 1) {
        // scrollToBottom();
      }
    },
  });

  const getSpaceMembersReq = useRequest(getSpaceMembers, {
    debounceInterval: 500,
    manual: true,
    onSuccess: (res) => {
      // console.log(res);
      setMemberList(res.list);
    },
  });

  const { sendMessage, connect } = useWebSocket(
    `ws://localhost:3000?target=discuss&taskId=${taskId}`,
    {
      reconnectInterval: 5000,
      manual: true,
      protocols: Cookies.get('token'),
      onMessage: (msg: WebSocketEventMap['message']) => {
        const data = JSON.parse(msg.data);
        console.log(data);
        if (!data.status) {
          setCommentList([...commentListRef.current, data]);
          setLightBoxUpdate(lightBoxUpdate + 1);
          recomputeRowHeights();
          const isUserSending = data.sender.id === currentUser.id;
          const list = document.getElementsByClassName('v-list')[0];
          const isNearBottom = list.scrollTop + list.clientHeight + 300 < list.scrollHeight;
          if (isUserSending || isNearBottom) {
            console.log('f');
            // scrollToBottom();
          }
        } else {
          message.error(data.message);
        }
      },
    },
  );

  useEffect(() => {
    if (taskId) connect();
  }, [taskId]);

  const handleSend = (content: string, type: string) => {
    const data = {
      taskId: taskId,
      content: content,
      type: type,
    };

    const sendData = JSON.stringify({ event: 'comment', data });
    sendMessage(sendData);
    form.resetFields();
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

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  const handleUpload = async (options) => {
    setUploading(true);
    const objectName = moment().format('YYYYMMDDhhmmss');
    const ossClient = await getOssClient();
    await ossClient.put(objectName, options.file);
    handleSend(objectName, 'image');
    setUploading(false);
  };

  return (
    <div style={{ height: '100%', minWidth: '250px', position: 'relative' }}>
      <Card
        bordered={false}
        style={{ height: 'calc(100vh - 300px)' }}
        bodyStyle={{ height: '100%', padding: '20px 10px' }}
      >
        <Virtuoso
          // style={{ height: '100%', padding: '20px 10px' }}
          ref={virtuosoRef}
          data={commentList}
          rangeChanged={(range) => {
            if (commentList[range.startIndex] && commentList[range.endIndex]) return;
            console.log(range);
            getCommentsReq.run(taskId, {
              skip: range.startIndex,
              take: range.endIndex - range.startIndex + 1,
            });
          }}
          // atBottomStateChange={bottom => {
          //   console.log(bottom)
          // }}
          followOutput={(isAtBottom: boolean) => {
            if (isAtBottom) {
              return 'smooth'; // can be 'auto' or false to avoid scrolling
            } else {
              return false;
            }
          }}
          itemContent={(index, comment) => {
            if (comment?.type === 'image' && !comment['_source']) {
              comment['_source'] = 'url';
              getOssClient().then((oss) => {
                comment['_source'] = oss.signatureUrl(comment.content, {
                  expires: 3600,
                });
                comment['_preview'] = oss.signatureUrl(comment.content, {
                  expires: 3600,
                  process: 'image/resize,w_300,h_300',
                });
              });
            }
            return (
              <MessageCard
                onTapContent={() => {
                  if (comment?.type === 'image') {
                    const sourceList = commentList
                      .filter((comment) => comment?.type === 'image')
                      .map((comment) => comment['_source']);
                    const i = sourceList.indexOf(comment['_source']);
                    setLightBoxSlide(i);
                    setLightBoxToggle(!lightBoxToggle);
                  }
                }}
                type={comment?.type}
                isMe={comment?.sender?.id === currentUser.id}
                isLoading={!comment}
                author={comment?.sender?.username}
                datetime={comment?.createAt}
                avatar={comment?.sender?.username}
                content={comment?.type === 'image' ? comment['_preview'] : comment?.content}
              />
            );
          }}
        />
      </Card>
      <Form form={form} onFinish={(v) => handleSend(v.content, 'text')}>
        <div style={{ padding: '10px 0', width: '100%' }}>
          <Space>
            <Upload
              disabled={isUploading}
              showUploadList={false}
              customRequest={handleUpload}
              beforeUpload={beforeUpload}
            >
              <Button icon={<PictureOutlined />} />
            </Upload>
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
          <Button
            disabled={isUploading}
            icon={isUploading ? <LoadingOutlined /> : <MessageOutlined />}
            style={{ float: 'right' }}
            type="primary"
            htmlType="submit"
          >
            发送
          </Button>
        </div>
        <Form.Item name="content" rules={contentRule}>
          <Mentions
            placeholder={'输入@来提醒某成员'}
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
      <FsLightbox
        key={lightBoxUpdate}
        style={{ zIndex: 99999 }}
        toggler={lightBoxToggle}
        sourceIndex={lightBoxSlide}
        sources={commentList
          .filter((comment) => comment?.type === 'image')
          .map((comment) => comment['_source'])}
        type="image"
      />
    </div>
  );
};
export default forwardRef(TaskComment);
