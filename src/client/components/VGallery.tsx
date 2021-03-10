import React, { useEffect, useRef, useState } from "react";
import { Empty, Spin } from "antd";
import InfiniteLoader from "react-window-infinite-loader";
import { VariableSizeGrid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useRequest } from "umi";

const VGallery: React.FC<{
  request: (body: any) => Promise<any>;
  update?: boolean;
  columnCount?: number;
  gutter?: [number, number];
  beforeItemRender?: (item) => Promise<any>;
  itemRender: (
    item: any,
    columnIndex?: number,
    rowIndex?: number
  ) => React.ReactNode;
}> = ({
  request,
  update = false,
  columnCount = 3,
  itemRender,
  beforeItemRender = async (item) => item,
  gutter = [10, 10],
}) => {
  const vGridRef = useRef(null);
  const infiniteLoaderRef = useRef(null);
  const fetchCountRef = useRef(0);
  const [items, setItems] = useState([]);
  const [updateRowHeights, setUpdateRowHeights] = useState(false);
  const rowHeightsRef = useRef({});

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
    onSuccess: async (res, params) => {
      for (
        let index = params[0].skip;
        index < params[0].skip + params[0].take;
        index++
      ) {
        const item = res.list[index - params[0].skip];
        items[index] = item;
        // items[index] = await beforeItemRender(item);
      }
      setItems(items);
    },
  });

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

  const getRowHeight = (index: number) => {
    return rowHeightsRef.current[index] || 300;
  };

  const setRowHeight = (index: number, size: number) => {
    vGridRef.current.resetAfterRowIndex(0);
    rowHeightsRef.current = { ...rowHeightsRef.current, [index]: size };
  };

  const resetColumnWidth = () => {
    if (vGridRef.current) vGridRef.current.resetAfterColumnIndex(0);
  };

  const resetHeightWidth = () => {
    setUpdateRowHeights(!updateRowHeights);
  };

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const item = items[rowIndex * columnCount + columnIndex];
    const rowRef = useRef(null);

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(rowIndex, rowRef.current.clientHeight);
      }
    }, [item, updateRowHeights]);

    const isRight = columnIndex === columnCount - 1;
    const isBottom = rowIndex === Math.ceil(items.length / columnCount) - 1;

    return (
      <div key={`${rowIndex}-${columnIndex}`} style={style}>
        {item ? (
          <div
            style={{
              padding: `${gutter[1]}px ${gutter[0]}px`,
            }}
            ref={rowRef}
          >
            {itemRender(item, columnIndex, rowIndex)}
          </div>
        ) : (
          <div ref={rowRef}></div>
        )}
      </div>
    );
  };

  return (
    <>
      <AutoSizer
        onResize={() => {
          resetColumnWidth();
          resetHeightWidth();
        }}
      >
        {({ width, height }) => (
          <InfiniteLoader
            ref={infiniteLoaderRef}
            isItemLoaded={isItemLoaded}
            itemCount={items.length}
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
                  overscanStartIndex: overscanRowStartIndex * columnCount,
                  overscanStopIndex: overscanRowStopIndex * columnCount,
                  visibleStartIndex: visibleRowStartIndex * columnCount,
                  visibleStopIndex: visibleRowStopIndex * columnCount,
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
                  columnCount={columnCount}
                  columnWidth={() => width / columnCount}
                  rowCount={Math.ceil(items.length / columnCount)}
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
      {initItemsReq.loading && (
        <div className="center-container" style={{ height: "100%" }}>
          <Spin className="center-item" />
        </div>
      )}
      {items.length === 0 && (
        <div className="center-container" style={{ height: "100%" }}>
          <Empty className="center-item" />
        </div>
      )}
    </>
  );
};

export default VGallery;
