import React, { useEffect, useRef, useState } from "react";
import { Card, Empty } from "antd";
import { Link, useModel, useParams, useRequest } from "umi";
import { getSpaceTasks, getSubTasks } from "../task.service";
import { GetTasksDTO, TaskDetailRes } from "@dtos/task.dto";
import InfiniteLoader from "react-window-infinite-loader";
import { VariableSizeGrid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import TaskCard from "./TaskCard";
import { getOssClient } from "../../layout/layout.service";
import { ViewOption } from "@server/task/entities/property.entity";

const COLUMN_COUNT = 3;
const TaskGallery: React.FC<{ option?: ViewOption; reload?: boolean }> = ({
  option,
  reload = false,
}) => {
  const currentTaskId = (useParams() as any).id;
  const { initialState } = useModel("@@initialState");
  const { currentSpace } = initialState;
  const [taskList, setTaskList] = useState<TaskDetailRes[]>([]);
  const taskListRef = useRef(null);
  const vGridRef = useRef(null);
  const [updateRowHeights, setUpdateRowHeights] = useState(false);
  const rowHeights = useRef({});
  const [update, setUpdate] = useState(false);
  const infiniteLoaderRef = useRef(null);
  const fetchCountRef = useRef(0);
  taskListRef.current = taskList;

  const getTasks = async (body: GetTasksDTO) => {
    const params = {};
    for (const header of option.headers) {
      if (header.filter) {
        switch (header.title) {
          case "dueAt":
            params["dueBefore"] = header.filter;
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
    refreshDeps: [reload, update, option],
    onSuccess: (res, params) => {
      setTaskList(Array(res.total).fill(undefined));
      if (infiniteLoaderRef.current && fetchCountRef.current !== 0) {
        infiniteLoaderRef.current.resetloadMoreItemsCache(true);
      }
      fetchCountRef.current++;
    },
  });

  const getTasksReq = useRequest(getTasks, {
    manual: true,
    onSuccess: async (res, params) => {
      const oss = await getOssClient();
      for (
        let index = params[0].skip;
        index < params[0].skip + params[0].take;
        index++
      ) {
        const task = res.list[index - params[0].skip];
        let cover;
        for (const block of task.content.content?.blocks || []) {
          if (block.type === "image") {
            cover = block.data.file.source;
            break;
          }
        }
        if (cover) {
          const _cover = cover.split(":");
          task["_source"] =
            _cover[0] === "oss"
              ? oss.signatureUrl(_cover[1], { expires: 3600 })
              : _cover[1];
          task["_preview"] =
            _cover[0] === "oss"
              ? oss.signatureUrl(_cover[1], {
                  expires: 3600,
                  process: "image/resize,w_500,h_150",
                })
              : _cover[1];
        } else {
          task["_source"] = (
            <div
              style={{ background: "white", width: "200px", height: "200px" }}
            >
              <h3 style={{ lineHeight: "200px", textAlign: "center" }}>
                no preview
              </h3>
            </div>
          );
        }
        taskList[index] = task;
      }
      setTaskList(taskList);
    },
  });

  const isItemLoaded = (index: number) => {
    return !!taskList[index];
  };

  const loadMoreItems = (startIndex: number, stopIndex: number) => {
    console.log(startIndex);
    console.log(stopIndex);
    return getTasksReq.run({
      skip: startIndex,
      take: stopIndex - startIndex + 1,
    });
  };

  const getRowHeight = (index: number) => {
    return rowHeights.current[index] || 300;
  };

  const setRowHeight = (index: number, size: number) => {
    vGridRef.current.resetAfterRowIndex(0);
    rowHeights.current = { ...rowHeights.current, [index]: size };
  };

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const task = taskList[rowIndex * 3 + columnIndex];
    const rowRef = useRef(null);

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(rowIndex, rowRef.current.clientHeight);
      }
    }, [task, updateRowHeights]);

    return (
      <div key={`${rowIndex}-${columnIndex}`} style={style}>
        {task ? (
          <div style={{ padding: 10 }} ref={rowRef}>
            <Link to={`/task/${task?.id}/content`}>
              <TaskCard
                content={task.content.content}
                name={task.name}
                cover={task["_preview"]}
              ></TaskCard>
            </Link>
          </div>
        ) : (
          <div ref={rowRef}></div>
        )}
      </div>
    );
  };

  return (
    <Card bodyStyle={{ height: "calc(100vh - 200px)", padding: 0 }}>
      <AutoSizer>
        {({ width, height }) => (
          <InfiniteLoader
            ref={infiniteLoaderRef}
            isItemLoaded={isItemLoaded}
            itemCount={taskList.length}
            loadMoreItems={loadMoreItems}
          >
            {({ onItemsRendered, ref }) => {
              const newItemsRendered = (gridData: any) => {
                const {
                  visibleRowStartIndex,
                  visibleRowStopIndex,
                  overscanRowStartIndex,
                  overscanRowStopIndex,
                } = gridData;
                onItemsRendered({
                  overscanStartIndex: overscanRowStartIndex * COLUMN_COUNT,
                  overscanStopIndex: overscanRowStopIndex * COLUMN_COUNT,
                  visibleStartIndex: visibleRowStartIndex * COLUMN_COUNT,
                  visibleStopIndex: visibleRowStopIndex * COLUMN_COUNT,
                });
              };

              return (
                <VariableSizeGrid
                  ref={(r) => {
                    vGridRef.current = r;
                    //@ts-ignore
                    return ref(r);
                  }}
                  style={{ overflowX: "hidden" }}
                  className="virtual-grid"
                  onItemsRendered={newItemsRendered}
                  columnCount={COLUMN_COUNT}
                  columnWidth={(index: number) => width / COLUMN_COUNT}
                  rowCount={Math.ceil(taskList.length / COLUMN_COUNT)}
                  rowHeight={getRowHeight}
                  estimatedRowHeight={300}
                  height={height}
                  width={width}
                >
                  {Cell}
                </VariableSizeGrid>
              );
            }}
          </InfiniteLoader>
        )}
      </AutoSizer>
      {taskList.length === 0 && (
        <div className="center-container" style={{ height: "100%" }}>
          <Empty className="center-item" />
        </div>
      )}
    </Card>
  );
}; // Usage

export default TaskGallery;
