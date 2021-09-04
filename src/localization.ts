/* 
   NOTICE
   Since version 3.2.5, the functionality in this file is by
   default NOT used for localizing OSRM instructions.
   Instead, we rely on the module osrm-text-instructions (https://github.com/Project-OSRM/osrm-text-instructions/).
   
   This file can still be used for other routing backends, or if you specify the
   stepToText option in the OSRMv1 class.
*/

import L from 'leaflet';
import Locale from './locales/types';
import importedLanguages from './locales';

const languageMap = new Map<string, Locale>();

export default class Localization extends L.Class {
  constructor(langs: string | string[]) {
    super();

    const languages = (Array.isArray(langs) ? langs : [langs, 'en']);

    for (const lang of languages) {
      languageMap.set(lang, importedLanguages[lang]);
    }
  }

  // TODO: Fix types
  localize(keys: string | string[], language = 'en') {
    const keyArray = (Array.isArray(keys) ? keys : [keys]);
    const lang = languageMap.get(language) || languageMap.get('en');

    let intermediate: any = lang;

    for (const key of keyArray) {
      intermediate = intermediate[key];
      if (!intermediate) {
        break;
      }
    }

    return intermediate;
  }
}
