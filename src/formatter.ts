import L from 'leaflet';
import Localization from './localization';
import { Locale, Units } from './locales/types';
import { IInstruction, ITextInstruction, IDirectionInstruction } from './common/types';

export interface FormatterOptions {
  /**
   * Units to use
   * @default 'metric'
   */
  units?: 'imperial' | 'metric';
  /**
   * Hash of unit names to use
   * @default { meters: 'm', kilometers: 'km', yards: 'yd', miles: 'mi', hours: 'h', minutes: 'mín', seconds: 's' }
   */
  unitNames?: Units | null;
  /**
   * Locale to use to convert instructions to text. Either use a provided one or bring your own
   * @default English
   */
  locale?: Locale;
  /**
   * How much rounding should be applied to distances: positive values use smart rounding, where higher means more accurate, lower less accurate; negative values means fixed precision, where the number of decimals is -roundingSensitivity
   * @default 1
   */
  roundingSensitivity?: number;
  /**
   * String template to use for formatting distances as a string; passed properties value and unit
   * @default '{value} {unit}'
   */
  distanceTemplate?: string;
}

function isTextInstruction(instruction: ITextInstruction | IDirectionInstruction): instruction is ITextInstruction {
  return (instruction as ITextInstruction).text !== undefined;
}

function isDirectionInstruction(instruction: ITextInstruction | IDirectionInstruction): instruction is IDirectionInstruction {
  return (instruction as IDirectionInstruction).type !== undefined;
}

/**
 * Implements functions to convert distances and times to strings, as well as converting an {@link IInstruction} to a string. Override or implement your own if you need to customize formatting.
 */
export default class Formatter extends L.Class {
  private readonly defaultOptions = {
    units: 'metric',
    unitNames: {
      meters: 'm',
      kilometers: 'km',
      yards: 'yd',
      miles: 'mi',
      hours: 'h',
      minutes: 'min',
      seconds: 's'
    },
    roundingSensitivity: 1,
    distanceTemplate: '{value} {unit}'
  };

  options: FormatterOptions;

  private readonly localization: Localization;

  constructor(options?: FormatterOptions) {
    super();

    this.options = {
      ...this.defaultOptions as FormatterOptions,
      ...options,
    }

    this.localization = new Localization(this.options.locale);
  }

  /**
   * Formats a distance given in meters to a string with the given (or suitable if not provided) precision and unit
   */
  formatDistance(distance: number, sensitivity = 0) {
    const { distanceTemplate = this.defaultOptions.distanceTemplate } = this.options;
    const unitNames = this.options.unitNames || this.localization.localize('units');
    const simpleRounding = sensitivity <= 0;
    let value: number;
    let yards: number;
    let data: {
      value: number;
      unit: string;
    };

    if (this.options.units === 'imperial') {
      yards = distance / 0.9144;
      if (yards >= 1000) {
        data = {
          value: this.round(distance / 1609.344, sensitivity),
          unit: unitNames.miles
        };
      } else {
        data = {
          value: this.round(yards, sensitivity),
          unit: unitNames.yards
        };
      }
    } else {
      value = this.round(distance, sensitivity);
      data = {
        value: value >= 1000 ? (value / 1000) : value,
        unit: value >= 1000 ? unitNames.kilometers : unitNames.meters
      };
    }

    if (simpleRounding) {
      data.value = parseFloat(data.value.toFixed(-sensitivity));
    }

    return L.Util.template(distanceTemplate, data);
  }

  round(distance: number, sensitivity?: number ) {
    const { roundingSensitivity = this.defaultOptions.roundingSensitivity } = this.options;
    const s = sensitivity || roundingSensitivity;
    const pow10 = Math.pow(10, (Math.floor(distance / s) + '').length - 1);
    const r = Math.floor(distance / pow10);
    const p = (r > 5) ? pow10 : pow10 / 2;

    return Math.round(distance / p) * p;
  }

  /**
   * Formats a time duration, given in seconds, to a string with suitable precision and unit
   */
  formatTime(time: number) {
    const unitNames = this.options.unitNames || this.localization.localize('units');
    // More than 30 seconds precision looks ridiculous
    const t = Math.round(time / 30) * 30;

    if (t > 86400) {
      return `${Math.round(t / 3600)} ${unitNames.hours}`;
    } else if (t > 3600) {
      return `${Math.round(t / 3600)} ${unitNames.hours} ${Math.round((t % 3600) / 60)} ${unitNames.minutes}`;
    } else if (t > 300) {
      return `${Math.round(t / 60)} ${unitNames.minutes}`;
    } else if (t >= 60) {
      const seconds = (t % 60 !== 0 ? `${t % 60} ${unitNames.seconds}` : '');
      return `${Math.round(t / 60)} ${unitNames.minutes}${seconds}`;
    } else {
      return `${t} ${unitNames.seconds}`;
    }
  }

  /**
   * Formats an instruction to a human readable text
   */
  formatInstruction(instruction: IInstruction, index: number) {
    if (!isTextInstruction(instruction)) {
      return this.capitalize(L.Util.template(this.getInstructionTemplate(instruction, index),
        {
          ...instruction, ...{
            exitStr: instruction.exit ? this.localization.localize('formatOrder')(instruction.exit) : '',
            dir: this.localization.localize(['directions', instruction.direction]),
            modifier: this.localization.localize(['directions', instruction.modifier])
          }
        }));
    } else {
      return instruction.text;
    }
  }

  /**
   * Returns an icon name depending on the instruction type or modifier
   * If it's a simple text instruction, no icon is returned by default
   */
  getIconName(instruction: IInstruction, index: number) {
    if (!isDirectionInstruction(instruction)) {
      return '';
    }

    switch (instruction.type) {
      case 'Head':
        if (index === 0) {
          return 'depart';
        }
        break;
      case 'WaypointReached':
        return 'via';
      case 'Roundabout':
        return 'enter-roundabout';
      case 'DestinationReached':
        return 'arrive';
    }

    switch (instruction.modifier) {
      case 'Straight':
        return 'continue';
      case 'SlightRight':
        return 'bear-right';
      case 'Right':
        return 'turn-right';
      case 'SharpRight':
        return 'sharp-right';
      case 'TurnAround':
      case 'Uturn':
        return 'u-turn';
      case 'SharpLeft':
        return 'sharp-left';
      case 'Left':
        return 'turn-left';
      case 'SlightLeft':
        return 'bear-left';
    }
  }

  capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.substring(1);
  }

  getInstructionTemplate(instruction: IDirectionInstruction, index: number) {
    const type = instruction.type === 'Straight' ? (index === 0 ? 'Head' : 'Continue') : instruction.type;
    let strings = this.localization.localize(['instructions', type]);

    if (!strings) {
      strings = [
        this.localization.localize(['directions', type]),
        ` ${this.localization.localize(['instructions', 'Onto'])}`
      ];
    }

    return strings[0] + (strings.length > 1 && instruction.road ? strings[1] : '');
  }
}

/**
 * Instantiates a new formatter with the provided options
 */
export function formatter(options?: FormatterOptions) {
  return new Formatter(options);
}