import Cookies from 'js-cookie';
import { history } from 'umi';
import jwt from 'jsonwebtoken';
import { stringMatch } from './utils/utils';

interface tokenPayload {
  id: number;
  perms: string[];
}

// src/access.ts
export default function () {
  return {
    hasPerms: (perms: string[] = []) => {
      // check if the token is valid, otherwise jump to login page
      const token = Cookies.get('token');
      if (!token) {
        history.push('/login');
      } else {
        return true
        // if (perms.length === 0) return true;
        // const payload = jwt.verify(token, 'secret') as tokenPayload;
        // const ownedPerms = payload.perms;
        // const validated: string[] = [];
        // for (const neededPerm of perms) {
        //   for (const ownedPerm of ownedPerms) {
        //     if (stringMatch(neededPerm, ownedPerm)) {
        //       validated.push(neededPerm);
        //       break; //break nested loop
        //     }
        //   }
        // }
        // if (validated.length !== 0) return true;
      }
      //TODO: check perms in token

      return false;
    },
  };
}
