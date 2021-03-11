import React, { useEffect, useRef, useState } from 'react';
import { Link, useModel, useRequest } from 'umi';
import { getSpaceTasks, getSubTasks } from '../task.service';
import { GetTasksDTO, TaskDetailRes, TaskMoreDetailRes } from '@dtos/task.dto';
import { getOssClient } from '../../layout/layout.service';
import VGallery from '@components/VGallery';
import TaskCard from './TaskCard';
import { ViewOption } from '@server/common/common.entity';

const TaskGallery: React.FC<{
  task?: TaskMoreDetailRes;
  headers?: any[];
  update?: boolean;
}> = ({ task, headers = [], update = false }) => {
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const [childUpdate, setChildUpdate] = useState(false);

  useEffect(() => {
    setChildUpdate(!childUpdate);
  }, [update]);

  const getTasks = async (body: GetTasksDTO) => {
    const params = {};
    for (const header of headers) {
      if (header.filter) params[header.title] = header.filter;
    }
    
    return task
      ? await getSubTasks(task.id, { ...params, ...body })
      : await getSpaceTasks(currentSpace.id, { ...params, ...body });
  };

  const beforeItemRender = async (item) => {
    const oss = await getOssClient();
    let cover;
    for (const block of item.content.content?.blocks || []) {
      if (block.type === 'image') {
        cover = block.data.file.source;
        break;
      }
    }
    if (cover) {
      const _cover = cover.split(':');
      item['_source'] =
        _cover[0] === 'oss' ? oss.signatureUrl(_cover[1], { expires: 3600 }) : _cover[1];
      item['_preview'] =
        _cover[0] === 'oss'
          ? oss.signatureUrl(_cover[1], {
              expires: 3600,
              process: 'image/resize,w_500,h_150',
            })
          : _cover[1];
    } else {
      item['_source'] = (
        <div style={{ background: 'white', width: '200px', height: '200px' }}>
          <h3 style={{ lineHeight: '200px', textAlign: 'center' }}>no preview</h3>
        </div>
      );
    }
    return item;
  };

  const itemRender = (item) => {
    return (
      <Link to={`/task/${item?.id}/content`}>
        <TaskCard content={item?.content.content} name={item?.name} cover={item['_preview']} />
      </Link>
    );
  };

  return (
    <VGallery
      request={getTasks}
      update={childUpdate}
      columnCount={5}
      beforeItemRender={beforeItemRender}
      itemRender={itemRender}
    />
  );
}; // Usage

export default TaskGallery;
