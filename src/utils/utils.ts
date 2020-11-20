import { createHash } from 'crypto';

export function hash(string: string) {
  const hash = createHash('md5');
  return hash.update(string).digest('hex');
}

// https://stackoverflow.com/questions/26246601/wildcard-string-comparison-in-javascript?answertab=votes#tab-top
export function stringMatch(str: string, rule: string) {
  const escapeRegex = (str: string) =>
    str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  return new RegExp(
    '^' + rule.split('*').map(escapeRegex).join('.*') + '$',
  ).test(str);
}
