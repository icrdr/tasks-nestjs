import React from 'react';
import { Access as UmiAccess, useAccess } from 'umi';

const Access: React.FC<{ perms?: string[] }> = ({ children, perms }) => {
  const access = useAccess();
  return (
    <UmiAccess accessible={access.hasPerms(perms)} fallback={<div>Can not read content.</div>}>
      {children}
    </UmiAccess>
  );
};
export default Access;
