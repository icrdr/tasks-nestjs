import React from 'react';
import { Access as UmiAccess, useAccess } from 'umi';

const Access: React.FC<{ roles?: string[] }> = ({ children, roles }) => {
  const access = useAccess();
  return (
    <UmiAccess accessible={access.inRoles(roles)} fallback={<div>Can not read content.</div>}>
      {children}
    </UmiAccess>
  );
};
export default Access;
