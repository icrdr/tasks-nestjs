import { getValidPerms } from '@/utils/utils';
import { initialState } from './pages/layout/layout.service';

function validPerms(neededPerms: string[], ownedPerms: string[]) {
  const validPerms = neededPerms.length === 0 ? ownedPerms : getValidPerms(neededPerms, ownedPerms);
  return validPerms.length !== 0;
}

export default function (initialState: initialState) {
  const { me } = initialState;
  return {
    hasPerms: (neededPerms: string[] = []) => {
      if (!me) return true;
      return validPerms(neededPerms, me.perms);
    },
    hasAdmin: () => {
      if (!me) return true;
      return validPerms(['admin.*'], me.perms);
    },
  };
}
