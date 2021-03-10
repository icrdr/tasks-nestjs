import React, { useEffect, useRef, useState } from 'react';
import { VariableSizeGrid } from 'react-window';
import { Table } from 'antd';
import InfiniteLoader from 'react-window-infinite-loader';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useRequest } from 'umi';

const VTable: React.FC<{
  request?: (body: any) => Promise<any>;
  columns: Array<any>;
  update?: boolean;
  rowHeight?: number;
  defaultColumnWidth?: number;
  defaultHeight?: number;
}> = ({
  request,
  columns,
  update = false,
  rowHeight = 56,
  defaultColumnWidth = 200,
  defaultHeight = 700,
}) => {
  const infiniteLoaderRef = useRef(null);
  const vGridRef = useRef(null);
  const wrapperRef = useRef(null);
  const fetchCountRef = useRef(0);
  const [items, setItems] = useState([]);
  const [updateRowHeights, setUpdateRowHeights] = useState(false);
  const rowHeights = useRef({});

  const height = wrapperRef.current?.clientHeight - 54 || defaultHeight;
  columns = columns.map((column) => {
    column.width = column.width || defaultColumnWidth;
    return column;
  });

  const initItemsReq = useRequest(request, {
    refreshDeps: [update],
    onSuccess: (res, params) => {
      setItems(Array(res.total).fill(undefined));
      if (fetchCountRef.current !== 0) {
        resetloadMore();
      }
      fetchCountRef.current++;
    },
  });

  const getTasksReq = useRequest(request, {
    manual: true,
    onSuccess: (res, params) => {
      for (let index = params[0].skip; index < params[0].skip + params[0].take; index++) {
        const item = res.list[index - params[0].skip];
        items[index] = item;
      }
      setItems(items);
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

  const isItemLoaded = (index: number) => {
    return !!items[index];
  };

  const resetloadMore = () => {
    if (infiniteLoaderRef.current) infiniteLoaderRef.current.resetloadMoreItemsCache(true);
  };

  const resetColumnWidth = () => {
    if (vGridRef.current) vGridRef.current.resetAfterColumnIndex(0);
  };

  const getRowHeight = (index: number) => {
    // console.log(rowHeights.current);
    return rowHeights.current[index] + 22 || 54;
  };

  const setRowHeight = (index: number, size: number) => {
    const _size = Math.max(size, rowHeights.current[index] || 0);
    // console.log(_size);
    vGridRef.current.resetAfterRowIndex(0);
    rowHeights.current = { ...rowHeights.current, [index]: _size };
  };

  const resetHeightWidth = () => {
    setUpdateRowHeights(!updateRowHeights);
  };

  useEffect(() => {
    resetloadMore();
  }, [update]);

  useEffect(() => {
    resetColumnWidth();
  }, [columns]);

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const item = items[rowIndex];
    const render = columns[columnIndex]?.render;
    const rowRef = useRef(null);

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(rowIndex, rowRef.current.clientHeight);
      }
    }, [item, updateRowHeights]);

    return (
      <div key={`${rowIndex}-${columnIndex}`} style={style} className="virtual-table-cell">
        {item && render ? <div ref={rowRef}>{render(<></>, item)}</div> : <div ref={rowRef}></div>}
      </div>
    );
  };

  const renderVirtualList = (rawData, { scrollbarSize, onScroll }) => {
    const totalHeight = rawData.length * rowHeight;
    return (
      <AutoSizer
        onResize={() => {
          resetColumnWidth();
          resetHeightWidth();
        }}
      >
        {({ width }) => {
          return (
            <InfiniteLoader
              ref={infiniteLoaderRef}
              isItemLoaded={isItemLoaded}
              itemCount={rawData.length}
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
                    columnCount={columns.length}
                    columnWidth={(index) => {
                      let fixedWidth = 0;
                      columns.forEach((column) => {
                        fixedWidth += column.width;
                      });
                      const w =
                        fixedWidth >= width
                          ? columns[index].width
                          : (columns[index].width / fixedWidth) * width;

                      return index === columns.length - 1 && totalHeight > height
                        ? w - scrollbarSize - 1
                        : w;
                    }}
                    rowCount={rawData.length}
                    rowHeight={getRowHeight}
                    height={height}
                    width={width}
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
        }}
      </AutoSizer>
    );
  };

  return (
    <div ref={wrapperRef} style={{ height: '100%' }}>
      <Table
        loading={initItemsReq.loading}
        dataSource={items}
        scroll={{
          y: height,
          x: '100vw',
        }}
        columns={columns}
        pagination={false}
        components={{
          body: renderVirtualList,
        }}
      />
    </div>
  );
};

export default VTable;
