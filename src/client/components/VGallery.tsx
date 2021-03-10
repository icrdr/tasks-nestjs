import React, { useEffect, useRef, useState } from 'react';
import { Empty, Spin } from 'antd';
import InfiniteLoader from 'react-window-infinite-loader';
import { VariableSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const VGallery: React.FC<{
  loading?: boolean;
  dataSource: Array<any>;
  update?: boolean;
  columnCount?: number;
  gutter?: [number, number];
  itemRender: (item: any, columnIndex?: number, rowIndex?: number) => React.ReactNode;
  loadMoreItems: (startIndex: number, stopIndex: number) => Promise<any>;
}> = ({
  loading = false,
  dataSource,
  loadMoreItems,
  update = false,
  columnCount = 3,
  itemRender,
  gutter = [10, 10],
}) => {
  const vGridRef = useRef(null);
  const [updateRowHeights, setUpdateRowHeights] = useState(false);
  const rowHeights = useRef({});
  const infiniteLoaderRef = useRef(null);

  const isItemLoaded = (index: number) => {
    return !!dataSource[index];
  };

  const getRowHeight = (index: number) => {
    return rowHeights.current[index] || 300;
  };

  const setRowHeight = (index: number, size: number) => {
    vGridRef.current.resetAfterRowIndex(0);
    rowHeights.current = { ...rowHeights.current, [index]: size };
  };

  const resetloadMore = () => {
    if (infiniteLoaderRef.current) infiniteLoaderRef.current.resetloadMoreItemsCache(true);
  };
  const resetColumnWidth = () => {
    if (vGridRef.current) vGridRef.current.resetAfterColumnIndex(0);
  };
  
  const resetHeightWidth = () => {
    setUpdateRowHeights(!updateRowHeights);
  };

  useEffect(() => {
    resetloadMore();
  }, [update]);

  useEffect(() => {
    resetColumnWidth();
    resetHeightWidth();
  }, [columnCount]);

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const item = dataSource[rowIndex * columnCount + columnIndex];
    const rowRef = useRef(null);

    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(rowIndex, rowRef.current.clientHeight);
      }
    }, [item, updateRowHeights]);

    const isRight = columnIndex === columnCount - 1;
    const isBottom = rowIndex === Math.ceil(dataSource.length / columnCount) - 1;
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
            itemCount={dataSource.length}
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
                  style={{ overflowX: 'hidden' }}
                  className="virtual-grid"
                  onItemsRendered={newItemsRendered}
                  columnCount={columnCount}
                  columnWidth={() => width / columnCount}
                  rowCount={Math.ceil(dataSource.length / columnCount)}
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
      {loading && (
        <div className="center-container" style={{ height: '100%' }}>
          <Spin className="center-item" />
        </div>
      )}
      {dataSource.length === 0 && (
        <div className="center-container" style={{ height: '100%' }}>
          <Empty className="center-item" />
        </div>
      )}
    </>
  );
};

export default VGallery;
