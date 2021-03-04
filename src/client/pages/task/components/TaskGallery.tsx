import React, { useRef, useState } from 'react';
import { Link, useModel, useParams, useRequest } from 'umi';
import { getSpaceTasks, getSubTasks } from '../task.service';
import { GetTasksDTO, TaskDetailRes } from '@dtos/task.dto';
import { getOssClient } from '../../layout/layout.service';
import { ViewOption } from '@server/task/entities/property.entity';
import VGallery from '@components/VGallery';
import TaskCard from './TaskCard';

const TaskGallery: React.FC<{ option?: ViewOption; update?: boolean }> = ({
  option,
  update = false,
}) => {
  const currentTaskId = (useParams() as any).id;
  const { initialState } = useModel('@@initialState');
  const { currentSpace } = initialState;
  const [taskList, setTaskList] = useState<TaskDetailRes[]>([]);
  const [dataUpdate, setDataUpdate] = useState(false);
  const [viewUpdate, setViewUpdate] = useState(false);
  const fetchCountRef = useRef(0);

  const getTasks = async (body: GetTasksDTO) => {
    const params = {};
    for (const header of option.headers) {
      if (header.filter) {
        switch (header.title) {
          case 'dueAt':
            params['dueBefore'] = header.filter;
            break;

          default:
            params[header.title] = header.filter;
            break;
        }
      }
    }
    return currentTaskId
      ? await getSubTasks(currentTaskId, { ...params, ...body })
      : await getSpaceTasks(currentSpace.id, { ...params, ...body });
  };

  const initTasksReq = useRequest(getTasks, {
    refreshDeps: [update, dataUpdate, option],
    onSuccess: (res, params) => {
      setTaskList(Array(res.total).fill(undefined));
      if (fetchCountRef.current !== 0) {
        setViewUpdate(!viewUpdate);
      }
      fetchCountRef.current++;
    },
  });

  const getTasksReq = useRequest(getTasks, {
    manual: true,
    onSuccess: async (res, params) => {
      const oss = await getOssClient();
      for (let index = params[0].skip; index < params[0].skip + params[0].take - 1; index++) {
        const task = res.list[index - params[0].skip];
        let cover;
        for (const block of task.content.content?.blocks || []) {
          if (block.type === 'image') {
            cover = block.data.file.source;
            break;
          }
        }
        if (cover) {
          const _cover = cover.split(':');
          task['_source'] =
            _cover[0] === 'oss' ? oss.signatureUrl(_cover[1], { expires: 3600 }) : _cover[1];
          task['_preview'] =
            _cover[0] === 'oss'
              ? oss.signatureUrl(_cover[1], {
                  expires: 3600,
                  process: 'image/resize,w_500,h_150',
                })
              : _cover[1];
        } else {
          task['_source'] = (
            <div style={{ background: 'white', width: '200px', height: '200px' }}>
              <h3 style={{ lineHeight: '200px', textAlign: 'center' }}>no preview</h3>
            </div>
          );
        }
        taskList[index] = task;
      }
      setTaskList(taskList);
    },
  });

  const loadMoreItems = (startIndex: number, stopIndex: number) => {
    console.log(startIndex);
    console.log(stopIndex);
    return getTasksReq.run({
      skip: startIndex,
      take: stopIndex - startIndex + 1,
    });
  };

  return (
    <VGallery
      loading={initTasksReq.loading}
      update={viewUpdate}
      dataSource={taskList}
      loadMoreItems={loadMoreItems}
      itemRender={(item) => (
        <Link to={`/task/${item?.id}/content`}>
          <TaskCard content={item.content.content} name={item.name} cover={item['_preview']} />
        </Link>
      )}
    />
  );
}; // Usage

export default TaskGallery;
