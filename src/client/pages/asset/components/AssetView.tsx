import React, { useEffect, useState } from "react";
import { useModel } from "umi";
import {
  Button,
  Dropdown,
  Input,
  Switch,
  Menu,
  Select,
  Space,
  DatePicker,
  Upload,
  message,
  Progress,
} from "antd";
import { PictureOutlined, SettingOutlined } from "@ant-design/icons";
import moment from "moment";
import AssetGallery from "./AssetGallery";
import { getOssClient } from "../../layout/layout.service";
import { addSpaceAsset, addTaskAsset } from "../../task/task.service";
import { getInitViewOption, sleep } from "@utils/utils";
import { ViewOption } from "@server/common/common.entity";
import { TaskMoreDetailRes } from "@dtos/task.dto";
import HeaderSetting from "@components/HeaderSetting";
import HeaderFilter from "@components/HeaderFilter";
const defaultOption = {
  form: "gallery",
  headers: [
    {
      title: "name",
      width: 150,
      filter: undefined,
      hidden: false,
    },
    {
      title: "format",
      width: 150,
      filter: undefined,
      hidden: false,
    },
    {
      title: "createAt",
      width: 200,
      filter: undefined,
      hidden: false,
    },
  ],
};

const AssetView: React.FC<{ task?: TaskMoreDetailRes }> = ({ task }) => {
  const { initialState } = useModel("@@initialState");
  const { currentSpace } = initialState;
  const [viewUpdate, setViewUpdate] = useState(false);
  const [viewOption, setViewOption] = useState<ViewOption>(null);
  const [isUploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const viewOptionKey = task
    ? `task${task.id}AssetViewOption`
    : `space${currentSpace.id}AssetViewOption`;

  const isFull =
    currentSpace?.userAccess === "full" || task?.userAccess === "full";
  const isEdit =
    isFull ||
    (task ? task.userAccess === "edit" : currentSpace.userAccess === "edit");

  useEffect(() => {
    const initViewOption = getInitViewOption(
      JSON.parse(localStorage.getItem(viewOptionKey)),
      defaultOption,
      currentSpace.assetProperties
    );

    setViewOption(initViewOption);
  }, []);

  const saveOption = (option) => {
    setViewOption(option);
    localStorage.setItem(viewOptionKey, JSON.stringify(option));
  };

  const handleSeletForm = (v) => {
    console.log(v);
    saveOption({ ...viewOption, form: v });
  };

  const handleUpload = async (options) => {
    const maxTimes = 5;
    setUploading(true);
    setUploadProgress(0);
    window.onbeforeunload = () => true;
    const objectName = moment().format("YYYYMMDDhhmmss");
    const oss = await getOssClient();
    const name = options.file.name.split(".").slice(-999, -1).join(".");
    const format = options.file.name.split(".").slice(-1)[0];
    const type = options.file.type;
    const size = options.file.size;

    if (!oss) {
      message.error("no oss");
      return false;
    }
    let checkpoint;
    let attemptCount = 0;
    // return false;
    while (true) {
      try {
        await oss.multipartUpload(objectName, options.file, {
          checkpoint,
          progress: (ptg, cpt) => {
            setUploadProgress(ptg * 100 - 10);
            checkpoint = cpt;
          },
        });
        break;
      } catch (err) {
        if (++attemptCount > maxTimes) {
          message.error("bad network");
          setUploading(false);
          window.onbeforeunload = undefined;
          return false;
        } else {
          console.log(attemptCount);
          message.error("retry in 5 seconds");
          await sleep(5000);
        }
      }
    }

    try {
      if (task) {
        await addTaskAsset(task.id, {
          name,
          format,
          type,
          size,
          source: "oss:" + objectName,
        });
      } else {
        await addSpaceAsset(currentSpace.id, {
          name,
          format,
          type,
          size,
          source: "oss:" + objectName,
        });
      }

      console.log("ok");
      setViewUpdate(!viewUpdate);
      setUploadProgress(100);
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
      window.onbeforeunload = undefined;
    }
  };

  return (
    <Space size="middle" direction="vertical" style={{ width: "100%" }}>
      <div className="left-right-layout-container">
        <Space>
          {isEdit &&
            (isUploading ? (
              <Progress
                percent={uploadProgress}
                style={{ width: "110px" }}
                format={(percent) => percent.toFixed(1) + "%"}
              />
            ) : (
              <Upload
                disabled={isUploading}
                showUploadList={false}
                // beforeUpload={beforeUpload}
                customRequest={handleUpload}
              >
                <Button
                  type={"primary"}
                  disabled={isUploading}
                  icon={<PictureOutlined />}
                >
                  上传文件
                </Button>
              </Upload>
            ))}

          <Select value={viewOption?.form} onChange={handleSeletForm}>
            <Select.Option value="table">表格</Select.Option>
            <Select.Option value="gallery">画廊</Select.Option>
          </Select>
          <HeaderSetting
            headers={viewOption?.headers}
            properties={currentSpace.assetProperties}
            onChange={(index, v) => {
              const headers = viewOption.headers;
              headers[index].hidden = !v;
              saveOption({ ...viewOption, headers });
            }}
            onReset={() => {
              setViewUpdate(!viewUpdate);
              localStorage.removeItem(viewOptionKey);
            }}
          />
        </Space>
        <HeaderFilter
          headers={viewOption?.headers}
          roles={currentSpace.roles}
          properties={currentSpace.taskProperties}
          onChange={(index, v) => {
            const headers = viewOption.headers.filter(
              (header) => !header.hidden
            );
            headers[index].filter = v;
            saveOption({ ...viewOption, headers });
          }}
        />
      </div>
      <div style={{ height: "calc(100vh - 100px)" }}>
        <AssetGallery
          headers={viewOption?.headers}
          update={viewUpdate}
          task={task}
        />
      </div>
    </Space>
  );
};
export default AssetView;
