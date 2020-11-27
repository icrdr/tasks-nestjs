import Cookies from 'js-cookie';
import { history } from 'umi';
import { getValidPerms, stringMatch } from '@/utils/utils';

// src/access.ts
export default function (initialState) {
  const { currentUser } = initialState;
  return {
    hasPerms: (neededPerms: string[] = []) => {
      // const token = Cookies.get('token');
      // const payload = jwt.verify(token, 'secret') as tokenPayload;
      if (!currentUser) {
        console.log('hi')
        return true
        // history.push('/login');
      }

      const ownedPerms = currentUser.perms;
      const validPerms =
        neededPerms.length === 0 ? ownedPerms : getValidPerms(neededPerms, ownedPerms);

      return validPerms.length !== 0;
    },
    has: () => {
      console.log('hi')
      // const token = Cookies.get('token');
      // console.log(initialState);
      return false;
    },
  };
}
