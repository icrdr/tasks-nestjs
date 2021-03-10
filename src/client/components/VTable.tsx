import React, { useEffect, useRef, useState } from "react";
import { VariableSizeGrid } from "react-window";
import { Table } from "antd";
import InfiniteLoader from "react-window-infinite-loader";
import AutoSizer from "react-virtualized-auto-sizer";
import { useRequest } from "umi";
import { useUpdateEffect } from "ahooks";

const VTable: React.FC<{
  request: (body: any) => Promise<any>;
  columns: Array<any>;
  update?: boolean;
  cellPadding?: number;
  defaultRowHeight?: number;
  defaultColumnWidth?: number;
  defaultHeight?: number;
}> = ({
  request,
  columns,
  update = false,
  cellPadding = 12,
  defaultRowHeight = 32,
  defaultHeight = 700,
}) => {
  const vGridRef = useRef(null);
  const wrapperRef = useRef(null);
  const infiniteLoaderRef = useRef(null);
  const fetchCountRef = useRef(0);
  const [items, setItems] = useState([]);
  const [updateRowHeights, setUpdateRowHeights] = useState(false);
  const rowHeightsRef = useRef({});
  const height = wrapperRef.current?.clientHeight - 55 || defaultHeight;

  const initItemsReq = useRequest(request, {
    refreshDeps: [update],
    onSuccess: (res, params) => {
      setItems(Array(res.total).fill(undefined));
      if (fetchCountRef.current !== 0) {
        resetLoadMore();
        resetCellSize();
      }
      fetchCountRef.current++;
    },
  });

  const getItemsReq = useRequest(request, {
    manual: true,
    onSuccess: (res, params) => {
      for (
        let index = params[0].skip;
        index < params[0].skip + params[0].take;
        index++
      ) {
        const item = res.list[index - params[0].skip];
        items[index] = item;
      }
      setItems(items);
    },
  });

  const loadMoreItems = (startIndex: number, stopIndex: number) => {
    console.log(startIndex);
    console.log(stopIndex);
    return getItemsReq.run({
      skip: startIndex,
      take: stopIndex - startIndex + 1,
    });
  };

  const isItemLoaded = (index: number) => {
    return !!items[index];
  };

  const resetLoadMore = () => {
    if (infiniteLoaderRef.current)
      infiniteLoaderRef.current.resetloadMoreItemsCache(true);
  };

  const resetCellSize = () => {
    //update ColumnWidths
    if (vGridRef.current) vGridRef.current.resetAfterColumnIndex(0);

    //update RowHeights
    rowHeightsRef.current = {};
    setUpdateRowHeights(!updateRowHeights);
  };

  const getRowHeight = (index: number) => {
    return (
      rowHeightsRef.current[index] || defaultRowHeight + cellPadding * 2 + 1
    );
  };

  const setRowHeight = (index: number, size: number) => {
    vGridRef.current.resetAfterRowIndex(0);
    const _size = Math.max(size, rowHeightsRef.current[index] || 0);
    rowHeightsRef.current = { ...rowHeightsRef.current, [index]: _size };
  };

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const item = items[rowIndex];
    const itemRender = columns[columnIndex]?.itemRender;
    const rowRef = useRef(null);

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(rowIndex, rowRef.current.clientHeight);
      }
    }, [item, updateRowHeights]);

    return (
      <div
        key={`${rowIndex}-${columnIndex}`}
        style={style}
        className="virtual-table-cell"
      >
        {item && itemRender ? (
          <div
            ref={rowRef}
            style={{
              padding: `${cellPadding}px`,
              lineHeight: `${defaultRowHeight}px`,
            }}
          >
            {itemRender(item)}
          </div>
        ) : (
          <div ref={rowRef}></div>
        )}
      </div>
    );
  };

  const renderVirtualList = (rawData, { scrollbarSize, onScroll }) => {
    const totalHeight =
      rawData.length * (defaultRowHeight + cellPadding * 2 + 1);
    return (
      <AutoSizer
        onResize={() => {
          resetCellSize();
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

                      return index === columns.length - 1 &&
                        totalHeight > height
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
    <div ref={wrapperRef} style={{ height: "100%" }}>
      <Table
        loading={initItemsReq.loading}
        dataSource={items}
        scroll={{
          y: height,
          x: "100vw",
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
