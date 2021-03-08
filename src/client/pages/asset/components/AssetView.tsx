import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
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
} from 'antd';
import { PictureOutlined, SettingOutlined } from '@ant-design/icons';
import moment from 'moment';
import AssetGallery from './AssetGallery';
import { getOssClient } from '../../layout/layout.service';
import { addSpaceAsset, addTaskAsset } from '../../task/task.service';
import { getInitViewOption, sleep } from '@utils/utils';
import { ViewOption } from '@server/common/common.entity';
import { TaskMoreDetailRes } from '@dtos/task.dto';

const AssetView: React.FC<{ task?: TaskMoreDetailRes }> = ({ task }) => {
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const [update, setUpdate] = useState(false);
  const [viewOption, setViewOption] = useState<ViewOption>(null);
  const [isUploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const viewOptionKey = task
    ? `task${task.id}AssetViewOption`
    : `space${currentSpace.id}AssetViewOption`;

  const isFull = currentSpace?.userAccess === 'full' || task?.userAccess === 'full';
  const isEdit = isFull || (task ? task.userAccess === 'edit' : currentSpace.userAccess === 'edit');

  useEffect(() => {
    const initViewOption = getInitViewOption(JSON.parse(localStorage.getItem(viewOptionKey)), {
      form: 'gallery',
      headers: [
        {
          title: 'name',
          width: 150,
          filter: undefined,
          hidden: false,
        },
        {
          title: 'format',
          width: 150,
          filter: undefined,
          hidden: false,
        },
        {
          title: 'createAt',
          width: 200,
          filter: undefined,
          hidden: false,
        },
      ],
    });

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

  const handleFilter = (index, v) => {
    const headers = viewOption.headers;
    headers[index].filter = v;
    saveOption({ ...viewOption, headers });
  };
  const handleHeaderDisplay = (index, v) => {
    const headers = viewOption.headers;
    headers[index].hidden = !v;
    saveOption({ ...viewOption, headers });
  };

  const filter = viewOption?.headers
    .filter((header) => !header.hidden)
    .map((header, index: number) => {
      const type = header.title.split(':')[0];
      switch (type) {
        case 'name':
          return (
            <Input.Search
              key={index}
              style={{ width: 150 }}
              placeholder="文件名"
              onSearch={(v) => handleFilter(index, v)}
              defaultValue={header.filter || ''}
              allowClear
            />
          );
        case 'format':
          return (
            <Input.Search
              key={index}
              style={{ width: 150 }}
              placeholder="格式名"
              onSearch={(v) => handleFilter(index, v)}
              defaultValue={header.filter || ''}
              allowClear
            />
          );
        case 'createAt':
          return (
            <DatePicker
              key={index}
              placeholder={'上传日期之前'}
              defaultValue={header.filter ? moment(header.filter) : undefined}
              onChange={(v) => handleFilter(index, v?.toDate() || undefined)}
            />
          );

        default:
          <div></div>;
      }
    });

  const menu = (
    <Menu>
      {viewOption?.headers.map((header, index) => {
        const type = header.title.split(':')[0];
        let title = type;

        let label = '';
        switch (title) {
          case 'name':
            label = '文件名';
            break;
          case 'format':
            label = '格式名';
            break;
          case 'createAt':
            label = '上传日期';
            break;
          default:
            label = title;
            break;
        }
        return (
          <Menu.Item key={index}>
            <Space>
              <Switch
                disabled={title === 'name'}
                size="small"
                defaultChecked={!header.hidden}
                onChange={(v) => handleHeaderDisplay(index, v)}
              />
              <span>{label}</span>
            </Space>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  // const beforeUpload = (file, fileList) => {
  //   return true;
  // };

  const handleUpload = async (options) => {
    const maxTimes = 5;
    setUploading(true);
    setUploadProgress(0);
    window.onbeforeunload = () => true;
    const objectName = moment().format('YYYYMMDDhhmmss');
    const oss = await getOssClient();
    const name = options.file.name.split('.').slice(-999, -1).join('.');
    const format = options.file.name.split('.').slice(-1)[0];
    const type = options.file.type;
    const size = options.file.size;

    if (!oss) {
      message.error('no oss');
      return false;
    }
    console.log(options.file);
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
        console.log(err);
        if (++attemptCount > maxTimes) {
          message.error('bad network');
          setUploading(false);
          window.onbeforeunload = undefined;
          return false;
        } else {
          console.log(attemptCount);
          message.error('retry in 5 seconds');
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
          source: 'oss:' + objectName,
        });
      } else {
        await addSpaceAsset(currentSpace.id, {
          name,
          format,
          type,
          size,
          source: 'oss:' + objectName,
        });
      }

      console.log('ok');
      setUpdate(!update);
      setUploadProgress(100);
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
      window.onbeforeunload = undefined;
    }
  };

  return (
    <Space size="middle" direction="vertical" style={{ width: '100%' }}>
      <div>
        <Space>
          {isEdit &&
            (isUploading ? (
              <Progress
                percent={uploadProgress}
                style={{ width: '110px' }}
                format={(percent) => percent.toFixed(1) + '%'}
              />
            ) : (
              <Upload
                disabled={isUploading}
                showUploadList={false}
                // beforeUpload={beforeUpload}
                customRequest={handleUpload}
              >
                <Button type={'primary'} disabled={isUploading} icon={<PictureOutlined />}>
                  上传文件
                </Button>
              </Upload>
            ))}

          <Select value={viewOption?.form} onChange={handleSeletForm}>
            <Select.Option value="table">表格</Select.Option>
            <Select.Option value="gallery">画廊</Select.Option>
          </Select>
          <Dropdown overlay={menu}>
            <Button icon={<SettingOutlined />} />
          </Dropdown>
        </Space>
        <Space style={{ float: 'right' }}>{filter}</Space>
      </div>
      <div style={{ height: 'calc(100vh - 100px)' }}>
        <AssetGallery headers={viewOption?.headers} update={update} task={task} />
      </div>
    </Space>
  );
};
export default AssetView;
