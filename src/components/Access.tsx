import React from 'react';
import { Access as UmiAccess, useAccess } from 'umi';

const Access: React.FC<{}> = ({ children }) => {
  const access = useAccess();
  return (
    <UmiAccess accessible={access.hasPerms([])} fallback={<div>Can not read foo content.</div>}>
      {children}
    </UmiAccess>
  );
};
export default Access;
