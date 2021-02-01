import { getValidAccess } from '@utils/utils';
import { initialState } from './pages/layout/layout.service';

export default function (initialState: initialState) {
  const { currentUser } = initialState;
  return {
    inRoles: (neededRoles: string[] = []) => {
      if (!currentUser) return false;
      return neededRoles.indexOf(currentUser.role) >= 0;
    },
    isAdmin: () => {
      if (!currentUser) return false;
      return currentUser.role === 'admin';
    },
  };
}
