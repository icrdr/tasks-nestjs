import React, { useEffect, useRef } from 'react';
import { VariableSizeGrid } from 'react-window';
import { Table } from 'antd';
import InfiniteLoader from 'react-window-infinite-loader';
import AutoSizer from 'react-virtualized-auto-sizer';

const VTable: React.FC<{
  loading?: boolean;
  columns: Array<any>;
  dataSource: Array<any>;
  update?: boolean;
  rowHeight?: number;
  defaultColumnWidth?: number;
  defaultHeight?: number;
  loadMoreItems: (startIndex: number, stopIndex: number) => Promise<any>;
}> = ({
  loading = false,
  columns,
  dataSource,
  loadMoreItems,
  update = false,
  rowHeight = 56,
  defaultColumnWidth = 200,
  defaultHeight = 700,
}) => {
  const infiniteLoaderRef = useRef(null);
  const vGridRef = useRef(null);
  const wrapperRef = useRef(null);
  const height = wrapperRef.current?.clientHeight - 54 || defaultHeight;
  columns = columns.map((column) => {
    column.width = column.width || defaultColumnWidth;
    return column;
  });

  const isItemLoaded = (index: number) => {
    return !!dataSource[index];
  };
  const resetloadMore = () => {
    if (infiniteLoaderRef.current) infiniteLoaderRef.current.resetloadMoreItemsCache(true);
  };
  const resetColumnWidth = () => {
    if (vGridRef.current) vGridRef.current.resetAfterColumnIndex(0);
  };

  useEffect(() => {
    resetloadMore();
  }, [update]);

  useEffect(() => {
    resetColumnWidth();
  }, [columns]);

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const task = dataSource[rowIndex];
    const column = columns[columnIndex];
    let content;
    if (task && column?.render) {
      content = columns[columnIndex].render(<></>, task);
    } else {
      content = '';
    }
    return (
      <div key={`${rowIndex}-${columnIndex}`} style={style} className="virtual-table-cell">
        {content}
      </div>
    );
  };

  const renderVirtualList = (rawData, { scrollbarSize, onScroll }) => {
    const totalHeight = rawData.length * rowHeight;
    return (
      <AutoSizer
        onResize={() => {
          resetColumnWidth();
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
                    rowHeight={() => rowHeight}
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
        loading={loading}
        dataSource={dataSource}
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
