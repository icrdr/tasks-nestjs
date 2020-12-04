import { getValidPerms } from '@/utils/utils';
import { initialState } from './pages/layout/layout.service';

function validPerms(neededPerms: string[], ownedPerms: string[]) {
  const validPerms = neededPerms.length === 0 ? ownedPerms : getValidPerms(neededPerms, ownedPerms);
  return validPerms.length !== 0;
}

export default function (initialState: initialState) {
  const { currentUser } = initialState;
  return {
    hasPerms: (neededPerms: string[] = []) => {
      if (!currentUser) return false;
      return validPerms(neededPerms, currentUser.perms);
    },
    hasAdmin: () => {
      if (!currentUser) return false;
      return validPerms(['admin.*'], currentUser.perms);
    },
  };
}
