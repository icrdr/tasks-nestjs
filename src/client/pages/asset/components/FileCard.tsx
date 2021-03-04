import React from 'react';
import { Input, Tooltip, Typography } from 'antd';

import { FileOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

const FileCard: React.FC<{
  onTapPreview?: Function;
  onPressEnter?: (v: string) => void;
  name: string;
  preview?: string;
  isEditing?: boolean;
  format?: string;
}> = ({
  onTapPreview = () => {},
  onPressEnter = () => {},
  name,
  format,
  preview,
  isEditing = true,
}) => {
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
      {isEditing ? (
        <Input.TextArea autoSize={{minRows:2,maxRows:2}} defaultValue={name} onPressEnter={(e) => {
          e.preventDefault()
          onPressEnter(e.currentTarget.value)}} />
      ) : (
        <div
          style={{
            textAlign: 'center',
            wordBreak: 'break-word',
            overflow: 'hidden',
            padding: '5px 10px',
            width: '100%',
            height: '50px',
          }}
          // ellipsis={{ tooltip: name }}
        >
          <Tooltip title={format ? `${name}.${format}` : name}>
            {format ? `${name}.${format}` : name}
          </Tooltip>
        </div>
      )}
    </div>
  );
};
export default FileCard;
