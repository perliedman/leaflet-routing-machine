/* 
   NOTICE
   Since version 3.2.5, the functionality in this file is by
   default NOT used for localizing OSRM instructions.
   Instead, we rely on the module osrm-text-instructions (https://github.com/Project-OSRM/osrm-text-instructions/).
   
   This file can still be used for other routing backends, or if you specify the
   stepToText option in the OSRMv1 class.
*/

import { Locale } from './locales/types';
import { en } from './locales';

export default class Localization {
  private readonly locale: Locale;

  constructor(locale?: Locale) {
    this.locale = locale ?? en;
  }

  // TODO: Fix types
  localize(keys: string | string[]) {
    const keyArray = (Array.isArray(keys) ? keys : [keys]);
    let intermediate: any = this.locale;

    for (const key of keyArray) {
      intermediate = intermediate[key];
      if (!intermediate) {
        break;
      }
    }

    return intermediate;
  }
}

export function localization(locale?: Locale) {
  return new Localization(locale);
}