import React from 'react';
import { Typography } from 'antd';

import { FileOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

const FileCard: React.FC<{
  onTapPreview?: Function;
  name: string;
  preview?: string;
  format?: string;
}> = ({ onTapPreview = () => {}, name, format, preview }) => {
  return (
    <div style={{ width: '100%' }}>
      <div
        onClick={() => onTapPreview()}
        className="file-card"
        style={{
          backgroundImage: `url(${preview})`,
        }}
      >
        {!preview && <FileOutlined />}
      </div>

      <Text
        style={{ textAlign: 'center', wordBreak: 'break-word', padding: '5px 10px', width: '100%' }}
        ellipsis={{ tooltip: name }}
      >
        {format ? `${name}.${format}` : name}
      </Text>
    </div>
  );
};
export default FileCard;
