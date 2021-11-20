import { Locale } from './types';

const ruLocale: Locale = {
  directions: {
    N: 'север',
    NE: 'северовосток',
    E: 'восток',
    SE: 'юговосток',
    S: 'юг',
    SW: 'югозапад',
    W: 'запад',
    NW: 'северозапад',
    SlightRight: 'плавно направо',
    Right: 'направо',
    SharpRight: 'резко направо',
    SlightLeft: 'плавно налево',
    Left: 'налево',
    SharpLeft: 'резко налево',
    Uturn: 'развернуться'
  },
  instructions: {
    'Head':
      ['Начать движение на {dir}', ' по {road}'],
    'Continue':
      ['Продолжать движение на {dir}', ' по {road}'],
    'SlightRight':
      ['Плавный поворот направо', ' на {road}'],
    'Right':
      ['Направо', ' на {road}'],
    'SharpRight':
      ['Резкий поворот направо', ' на {road}'],
    'TurnAround':
      ['Развернуться'],
    'SharpLeft':
      ['Резкий поворот налево', ' на {road}'],
    'Left':
      ['Поворот налево', ' на {road}'],
    'SlightLeft':
      ['Плавный поворот налево', ' на {road}'],
    'WaypointReached':
      ['Точка достигнута'],
    'Roundabout':
      ['{exitStr} съезд с кольца', ' на {road}'],
    'DestinationReached':
      ['Окончание маршрута'],
    'Fork': ['На развилке поверните {modifier}', ' на {road}'],
    'Merge': ['Перестройтесь {modifier}', ' на {road}'],
    'OnRamp': ['Поверните {modifier} на съезд', ' на {road}'],
    'OffRamp': ['Съезжайте на {modifier}', ' на {road}'],
    'EndOfRoad': ['Поверните {modifier} в конце дороги', ' на {road}'],
    'Onto': 'на {road}'
  },
  formatOrder: function (n) {
    return n + '-й';
  },
  ui: {
    startPlaceholder: 'Начало',
    viaPlaceholder: 'Через {viaNumber}',
    endPlaceholder: 'Конец'
  },
  units: {
    meters: 'м',
    kilometers: 'км',
    yards: 'ярд',
    miles: 'ми',
    hours: 'ч',
    minutes: 'м',
    seconds: 'с'
  }
}

export default ruLocale;