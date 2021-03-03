import { getValidAccess } from '@utils/utils';
import { initialState } from './pages/layout/layout.service';

export default function (initialState: initialState) {
  const { currentUser, currentSpace } = initialState;
  return {
    hasSpace: () => currentSpace,
    isAdmin: () => currentUser?.role === 'admin',
    isSpaceAdmin: () => currentSpace?.userAccess === 'full',
  };
}
