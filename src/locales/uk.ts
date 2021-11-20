import { Locale } from './types';

const ukLocale: Locale = {
  directions: {
    N: 'північ',
    NE: 'північний схід',
    E: 'схід',
    SE: 'південний схід',
    S: 'південь',
    SW: 'південний захід',
    W: 'захід',
    NW: 'північний захід',
    SlightRight: 'плавно направо',
    Right: 'направо',
    SharpRight: 'різко направо',
    SlightLeft: 'плавно наліво',
    Left: 'наліво',
    SharpLeft: 'різко наліво',
    Uturn: 'розвернутися',
  },
  instructions: {
    'Head':
      ['Почати рух на {dir}', 'по {road}'],
    'Continue':
      ['Продовжувати рух на {dir}', 'по {road}'],
    'SlightRight':
      ['Плавний поворот направо', 'на {road}'],
    'Right':
      ['Направо', 'на {road}'],
    'SharpRight':
      ['Різкий поворот направо', 'на {road}'],
    'TurnAround':
      ['Розгорнутися'],
    'SharpLeft':
      ['Різкий поворот наліво', 'на {road}'],
    'Left':
      ['Поворот наліво', 'на {road}'],
    'SlightLeft':
      ['Плавний поворот наліво', 'на {road}'],
    'WaypointReached':
      ['Точка досягнута'],
    'Roundabout':
      ["{ExitStr} з'їзд з кільця", 'на {road}'],
    'DestinationReached':
      ['Закінчення маршруту'],
    'Fork': ['На розвилці поверніть {modifier}', 'на {road}'],
    'Merge': ['Візьміть {modifier}', 'на {road}'],
    'OnRamp': ["Поверніть {modifier} на з'їзд", 'на {road}'],
    'OffRamp': ["З'їжджайте на {modifier}", 'на {road}'],
    'EndOfRoad': ['Поверніть {modifier} в кінці дороги', 'на {road}'],
    'Onto': 'на {road}'
  },
  formatOrder: function (n) {
    return n + '-й';
  },
  ui: {
    startPlaceholder: 'Початок',
    viaPlaceholder: 'Через {viaNumber}',
    endPlaceholder: 'Кінець'
  },
  units: {
    meters: 'м',
    kilometers: 'км',
    yards: 'ярд',
    miles: 'ми',
    hours: 'г',
    minutes: 'хв',
    seconds: 'сек'
  }
};

export default ukLocale;