import { Locale } from './locales/types';
import { en } from './locales';

/**
 * Contains localization for strings used by the control. The object is a simple hash with language code as key.
 */
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