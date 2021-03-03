import React, { useState, useEffect, useRef } from "react";
import { VariableSizeGrid } from "react-window";
import ResizeObserver from "rc-resize-observer";
import { Avatar, Badge, Card, Dropdown, Empty, Menu, Table } from "antd";
import moment from "moment";
import { Link, useModel, useParams, useRequest } from "umi";
import { getSpaceTasks, getSubTasks } from "../task.service";
import { GetTasksDTO, TaskDetailRes } from "@dtos/task.dto";
import InfiniteLoader from "react-window-infinite-loader";
import { AssignmentRes, MemberRes } from "@dtos/space.dto";
import { ViewOption } from "@server/task/entities/property.entity";

const HEIGHT = 700;
const ROW_HEIGHT = 56;

const TaskTable: React.FC<{ option: ViewOption; reload?: boolean }> = ({
  option,
  reload = false,
}) => {
  const currentTaskId = (useParams() as any).id;
  const { initialState } = useModel("@@initialState");
  const { currentSpace } = initialState;

  const columns = option.headers
    .filter((header) => !header.hidden)
    .map((header) => {
      const type = header.title.split(":")[0];
      switch (type) {
        case "name":
          return {
            dataIndex: "name",
            title: "任务名",
            width: header.width,
            render: (_, task: TaskDetailRes) => (
              <Link to={`/task/${task.id}/content`}>{task.name}</Link>
            ),
          };
        case "state":
          return {
            dataIndex: "state",
            title: "状态",
            width: header.width,
            render: (_, task: TaskDetailRes) => {
              switch (task.state) {
                case "suspended":
                  return <Badge status="default" text="暂停中" />;
                case "inProgress":
                  return <Badge status="processing" text="进行中" />;
                case "unconfirmed":
                  return <Badge status="warning" text="待确认" />;
                case "completed":
                  return <Badge status="success" text="已完成" />;

                default:
                  return <Badge status="warning" text="未知" />;
              }
            },
          };
        case "dueAt":
          return {
            dataIndex: "dueAt",
            title: "截止日",
            width: 100,
            render: (_, task: TaskDetailRes) => (
              <div>
                {task.dueAt ? moment(task.dueAt).format("YYYY/MM/DD") : "/"}
              </div>
            ),
          };
        case "role":
          const role = currentSpace.roles.filter(
            (r) => r.id === parseInt(header.title.split(":")[1])
          )[0];
          if (!role) return undefined;
          return {
            title: role.name,
            dataIndex: header.title,
            render: (_, task) => {
              const assignments = task.roles[role.id];
              return (
                <Avatar.Group>
                  {assignments?.map(
                    (assignment: AssignmentRes, index: number) => (
                      <Avatar key={index}>
                        {(assignment.members[0] as MemberRes).username}
                      </Avatar>
                    )
                  )}
                </Avatar.Group>
              );
            },
          };
        default:
          return undefined;
      }
    })
    .filter((c) => c !== undefined);

  const [tableWidth, setTableWidth] = useState(0);
  const [tableHeight, setTableHeight] = useState(0);
  const [taskList, setTaskList] = useState<TaskDetailRes[]>([]);
  const taskListRef = useRef(null);
  const vGridRef = useRef(null);
  const [update, setUpdate] = useState(false);
  const infiniteLoaderRef = useRef(null);
  const fetchCountRef = useRef(0);
  taskListRef.current = taskList;

  const getTasks = async (body: GetTasksDTO) => {
    const params = {};
    for (const header of option.headers.filter((header) => !header.hidden)) {
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
    onSuccess: (res, params) => {
      for (
        let index = params[0].skip;
        index < params[0].skip + params[0].take;
        index++
      ) {
        taskList[index] = res.list[index - params[0].skip];
      }
      setTaskList(taskList);
    },
  });

  const noWidthCount = columns.filter((column) => !column.width).length;

  let totalWidth = 0;
  columns
    .filter((column) => !!column.width)
    .forEach((column) => {
      totalWidth += column.width;
    });

  const widthFixedColumns = columns.map((column) => {
    if (noWidthCount === 0) {
      column.width = (column.width / totalWidth) * tableWidth;
    } else {
      column.width =
        column.width || Math.floor((tableWidth - totalWidth) / noWidthCount);
    }

    return column;
  });

  const [connectObject] = useState(() => {
    const obj = {};
    Object.defineProperty(obj, "scrollLeft", {
      get: () => null,
      set: (scrollLeft) => {
        if (vGridRef.current) {
          vGridRef.current.scrollTo({
            scrollLeft,
          });
        }
      },
    });
    return obj;
  });

  const resetVirtualGrid = () => {
    vGridRef.current.resetAfterIndices({
      columnIndex: 0,
      shouldForceUpdate: false,
    });
  };

  useEffect(() => resetVirtualGrid, [tableWidth, option]);

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

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const task = taskList[rowIndex];
    const column = columns[columnIndex];
    let content;
    if (task && column.render) {
      content = columns[columnIndex].render(<></>, task);
    } else {
      content = "";
    }
    return (
      <div
        key={`${rowIndex}-${columnIndex}`}
        style={style}
        className="virtual-table-cell"
      >
        {content}
      </div>
    );
  };

  const renderVirtualList = (rawData, { scrollbarSize, ref, onScroll }) => {
    ref.current = connectObject;
    const totalHeight = taskList.length * ROW_HEIGHT;
    return (
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
              overscanStartIndex: overscanRowStartIndex,
              overscanStopIndex: overscanRowStopIndex,
              visibleStartIndex: visibleRowStartIndex,
              visibleStopIndex: visibleRowStopIndex,
            });
          };

          return (
            <VariableSizeGrid
              ref={(r) => {
                vGridRef.current = r;
                //@ts-ignore
                return ref(r);
              }}
              className="virtual-grid"
              onItemsRendered={newItemsRendered}
              columnCount={widthFixedColumns.length}
              columnWidth={(index) => {
                const { width } = widthFixedColumns[index];
                return totalHeight > HEIGHT &&
                  index === widthFixedColumns.length - 1
                  ? width - scrollbarSize - 1
                  : width;
              }}
              rowCount={taskList.length}
              rowHeight={() => ROW_HEIGHT}
              height={HEIGHT}
              width={tableWidth}
              onScroll={({ scrollLeft }) => {
                onScroll({
                  scrollLeft,
                });
              }}
            >
              {Cell}
            </VariableSizeGrid>
          );
        }}
      </InfiniteLoader>
    );
  };

  return (
    <Card bodyStyle={{ padding: 0 }}>
      <ResizeObserver
        onResize={({ width, height }) => {
          setTableWidth(width);
          // setTableHeight()
        }}
      >
        <Table
          loading={initTasksReq.loading}
          dataSource={taskList}
          scroll={{
            y: HEIGHT,
            x: "100vw",
          }}
          className="virtual-table"
          columns={widthFixedColumns}
          pagination={false}
          components={{
            body: renderVirtualList,
          }}
        />
      </ResizeObserver>
      {taskList.length === 0 && (
        <div className="center-container" style={{ height: "100%" }}>
          <Empty className="center-item" />
        </div>
      )}
    </Card>
  );
}; // Usage

export default TaskTable;
