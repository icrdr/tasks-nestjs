import { createHash } from 'crypto';

export function hash(string: string) {
  const hash = createHash('md5');
  return hash.update(string).digest('hex');
}

// https://stackoverflow.com/questions/26246601/wildcard-string-comparison-in-javascript?answertab=votes#tab-top
export function stringMatch(str: string, rule: string) {
  const escapeRegex = (str: string) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  return new RegExp('^' + rule.split('*').map(escapeRegex).join('.*') + '$').test(str);
}

export function getValidPerms(neededPerms: string[], ownedPerms: string[]) {
  const validPerms: string[] = [];
  for (const neededPerm of neededPerms) {
    for (const ownedPerm of ownedPerms) {
      if (stringMatch(neededPerm, ownedPerm)) {
        validPerms.push(neededPerm);
        break; //break nested loop
      }
    }
  }
  return validPerms;
}

export function selectFiles(config: { multiple?: boolean; accept?: string } = {}) {
  return new Promise((resolve, reject) => {
    /**
     * Create a new INPUT element
     * @type {HTMLElement}
     */
    const inputElement = document.createElement('INPUT');

    /**
     * Set a 'FILE' type for this input element
     * @type {string}
     */
    //@ts-ignore
    inputElement.type = 'file';

    if (config.multiple) {
      inputElement.setAttribute('multiple', 'multiple');
    }

    if (config.accept) {
      inputElement.setAttribute('accept', config.accept);
    }

    /**
     * Do not show element
     */
    inputElement.style.display = 'none';

    /**
     * Append element to the body
     * Fix using module on mobile devices
     */
    document.body.appendChild(inputElement);

    /**
     * Add onchange listener for «choose file» pop-up
     */
    inputElement.addEventListener(
      'change',
      (event) => {
        /**
         * Get files from input field
         */
        //@ts-ignore
        const files = event.target.files;

        /**
         * Return ready to be uploaded files array
         */
        resolve(files);

        /**
         * Remove element from a DOM
         */
        document.body.removeChild(inputElement);
      },
      false,
    );

    /**
     * Fire click event on «input file» field
     */
    inputElement.click();
  });
}
