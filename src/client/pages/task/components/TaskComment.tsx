import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Button,
  Card,
  Form,
  Mentions,
  Popover,
  Space,
  message,
  Upload,
  Typography,
} from "antd";
import Cookies from "js-cookie";
import { CommentRes } from "@dtos/task.dto";
import useWebSocket from "@hooks/useWebSocket";
import { useModel, useRequest } from "umi";
import { getSpaceMembers } from "../../member/member.service";
import { MemberRes } from "@dtos/space.dto";
import {
  LoadingOutlined,
  MessageOutlined,
  PictureOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { Picker } from "emoji-mart";
import { getTaskComments } from "../task.service";
import MessageCard from "./MessageCard";
import moment from "moment";
import { getOssClient } from "../../layout/layout.service";
import { RcFile } from "antd/lib/upload";
import FsLightbox from "@components/fslightbox";
import { VariableSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import InfiniteLoader from "react-window-infinite-loader";
import { CommentType } from "../../../../server/common/common.entity";
const { Text, Paragraph } = Typography;

const TaskComment = ({ taskId, editable }, ref) => {
  const { initialState } = useModel("@@initialState");
  const { currentUser, currentSpace } = initialState;

  const vListRef = useRef<VariableSizeList>(null);
  const [form] = Form.useForm();
  const [lightBoxSlide, setLightBoxSlide] = useState(0);
  const [lightBoxToggle, setLightBoxToggle] = useState(false);
  const [lightBoxUpdate, setLightBoxUpdate] = useState(0);

  const [commentList, setCommentList] = useState<CommentRes[]>([]);
  const [isUploading, setUploading] = useState(false);
  const [memberList, setMemberList] = useState<MemberRes[]>([]);
  const commentListRef = useRef(null);

  const [updateRowHeights, setUpdateRowHeights] = useState(false);
  const rowHeights = useRef({});
  commentListRef.current = commentList;

  useRequest(() => getTaskComments(taskId), {
    ready: !!taskId,
    onSuccess: (res) => {
      setCommentList(Array(res.total).fill(undefined));
      scrollToBottom();
    },
  });

  const recomputeRowHeights = () => {
    setUpdateRowHeights(!updateRowHeights);
  };

  const scrollToDate = (date: Date) => {
    getTaskComments(taskId, { dateAfter: date }).then((res) => {
      console.log(res);
      if (res.list.length > 0) {
        vListRef.current.scrollToItem(res.list[0].index, "start");
      } else {
        scrollToBottom();
      }
    });
  };

  const scrollToBottom = () => {
    vListRef.current.scrollToItem(commentListRef.current.length - 1, "end");
  };

  useImperativeHandle(ref, () => ({
    recomputeRowHeights,
    scrollToDate,
    scrollToBottom,
  }));

  const getCommentsReq = useRequest(getTaskComments, {
    debounceInterval: 500,
    manual: true,
    onSuccess: async (res, params) => {
      const oss = await getOssClient();

      for (
        let index = params[1].skip;
        index < params[1].skip + params[1].take;
        index++
      ) {
        const comment = res.list[index - params[1].skip];
        if (comment?.type === "image" && !comment["_source"]) {
          comment["_source"] = "url";

          comment["_source"] = oss.signatureUrl(comment.content, {
            expires: 3600,
          });
          comment["_preview"] = oss.signatureUrl(comment.content, {
            expires: 3600,
            process: "image/resize,w_300,h_300",
          });
        }
        commentList[comment.index] = comment;
      }
      setCommentList(commentList);
      setLightBoxUpdate(lightBoxUpdate + 1);

      if (res.list[res.list.length - 1].index === res.total - 1) {
        scrollToBottom();
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
      protocols: Cookies.get("token"),
      onMessage: (msg: WebSocketEventMap["message"]) => {
        const data = JSON.parse(msg.data);
        console.log(data);
        if (!data.status) {
          const oss = getOssClient().then((oss) => {
            const comment = data;
            if (comment?.type === "image" && !comment["_source"]) {
              comment["_source"] = "url";

              comment["_source"] = oss.signatureUrl(comment.content, {
                expires: 3600,
              });
              comment["_preview"] = oss.signatureUrl(comment.content, {
                expires: 3600,
                process: "image/resize,w_300,h_300",
              });
            }
            setCommentList([...commentListRef.current, data]);
            setLightBoxUpdate(lightBoxUpdate + 1);

            const isUserSending = data.sender.id === currentUser.id;
            const list = document.getElementsByClassName("v-list")[0];
            const isNearBottom =
              list.scrollTop + list.clientHeight + 300 < list.scrollHeight;
            if (isUserSending || isNearBottom) {
              scrollToBottom();
            }
          });
        } else {
          message.error(data.message);
        }
      },
    }
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

    const sendData = JSON.stringify({ event: "comment", data });
    sendMessage(sendData);
    form.resetFields();
  };

  const handleEmojiSelete = (emoji) => {
    const preValue = form.getFieldsValue();
    preValue.content = preValue.content
      ? preValue.content + emoji.native
      : emoji.native;
    form.setFieldsValue(preValue);
  };
  const contentRule = [
    {
      required: true,
      message: "必填",
    },
  ];

  const isItemLoaded = (index: number) => {
    return !!commentList[index];
  };

  const loadMoreItems = (startIndex: number, stopIndex: number) => {
    return getCommentsReq.run(taskId, {
      skip: startIndex,
      take: stopIndex - startIndex + 1,
    });
  };

  const getRowHeight = (index: number) => {
    return rowHeights.current[index] || 86;
  };

  const setRowHeight = (index: number, size: number) => {
    vListRef.current.resetAfterIndex(0);
    rowHeights.current = { ...rowHeights.current, [index]: size };
  };

  const Row = ({ index, style }) => {
    const comment = commentList[index];
    const rowRef = useRef(null);

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.clientHeight);
      }
    }, [rowRef, updateRowHeights]);

    return (
      <div style={{ ...style }}>
        <MessageCard
          ref={rowRef}
          onTapContent={() => {
            if (comment?.type === "image") {
              const sourceList = commentList
                .filter((comment) => comment?.type === "image")
                .map((comment) => comment["_source"]);
              const i = sourceList.indexOf(comment["_source"]);
              setLightBoxSlide(i);
              setLightBoxToggle(!lightBoxToggle);
            }
          }}
          type={comment?.type as CommentType}
          isMe={comment?.sender?.id === currentUser.id}
          isLoading={!comment}
          author={comment?.sender?.username}
          datetime={comment?.createAt}
          avatar={comment?.sender?.username}
          content={
            comment?.type === "image" ? comment["_preview"] : comment?.content
          }
        />
      </div>
    );
  };

  const infiniteLoader = (
    <AutoSizer>
      {({ width, height }) => (
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={commentList.length}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }) => (
            <VariableSizeList
              className="v-list"
              itemCount={commentList.length}
              itemSize={getRowHeight}
              onItemsRendered={onItemsRendered}
              height={height}
              width={width}
              estimatedItemSize={86}
              ref={(r) => {
                vListRef.current = r;
                //@ts-ignore
                return ref(r);
              }}
            >
              {Row}
            </VariableSizeList>
          )}
        </InfiniteLoader>
      )}
    </AutoSizer>
  );

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must smaller than 2MB!");
    }
    return isJpgOrPng && isLt2M;
  };

  const handleUpload = async (options) => {
    setUploading(true);
    const objectName = moment().format("YYYYMMDDhhmmss");
    const ossClient = await getOssClient();
    await ossClient.put(objectName, options.file);
    handleSend(objectName, "image");
    setUploading(false);
  };

  return (
    <div style={{ height: "100%", minWidth: "250px", position: "relative" }}>
      <Card
        bordered={false}
        style={{
          height: editable ? "calc(100vh - 182px)" : "100vh",
        }}
        bodyStyle={{ height: "100%", padding: 0 }}
      >
        {infiniteLoader}
      </Card>
      {editable && (
        <Form form={form} onFinish={(v) => handleSend(v.content, "text")}>
          <div style={{ padding: "10px 0", width: "100%" }}>
            <Space>
              <Upload
                disabled={isUploading}
                showUploadList={false}
                customRequest={handleUpload}
                beforeUpload={beforeUpload}
                accept="image/png, image/jpeg"
              >
                <Button icon={<PictureOutlined />} />
              </Upload>
              <Popover
                trigger={"click"}
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
              style={{ float: "right" }}
              type="primary"
              htmlType="submit"
            >
              发送
            </Button>
          </div>
          <Form.Item name="content" rules={contentRule}>
            <Mentions
              placeholder={"输入@来提醒某成员"}
              style={{ width: "100%" }}
              loading={getSpaceMembersReq.loading}
              autoSize={{ minRows: 5, maxRows: 5 }}
              onSearch={(text) => {
                console.log("text");
                getSpaceMembersReq.run(currentSpace.id, { username: text });
              }}
            >
              {memberList.map((member) => (
                <Mentions.Option
                  key={member.userId.toString()}
                  value={member.username}
                >
                  <span>{member.username}</span>
                </Mentions.Option>
              ))}
            </Mentions>
          </Form.Item>
        </Form>
      )}

      <FsLightbox
        key={lightBoxUpdate}
        style={{ zIndex: 99999 }}
        toggler={lightBoxToggle}
        sourceIndex={lightBoxSlide}
        sources={commentList
          .filter((comment) => comment?.type === "image")
          .map((comment) => comment["_source"])}
        type="image"
      />
    </div>
  );
};
export default forwardRef(TaskComment);
