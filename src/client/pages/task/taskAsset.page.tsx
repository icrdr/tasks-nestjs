import React, { useRef, useState } from 'react';
import AssetGallery from '../asset/components/AssetGallery';

const TaskAsset: React.FC<{}> = () => {
  return (
    <div style={{ position: 'relative', width: '100%', margin: '0px auto', maxWidth: '1200px' }}>
      <AssetGallery />
    </div>
  );
};
export default TaskAsset;
