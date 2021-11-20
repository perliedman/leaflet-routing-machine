import { Locale } from './types';

const plLocale: Locale = {
  directions: {
    N: 'północ',
    NE: 'północny wschód',
    E: 'wschód',
    SE: 'południowy wschód',
    S: 'południe',
    SW: 'południowy zachód',
    W: 'zachód',
    NW: 'północny zachód',
    SlightRight: 'lekko w prawo',
    Right: 'w prawo',
    SharpRight: 'ostro w prawo',
    SlightLeft: 'lekko w lewo',
    Left: 'w lewo',
    SharpLeft: 'ostro w lewo',
    Uturn: 'zawróć'
  },
  instructions: {
    // instruction, postfix if the road is named
    'Head':
      ['Kieruj się na {dir}', ' na {road}'],
    'Continue':
      ['Jedź dalej przez {dir}'],
    'TurnAround':
      ['Zawróć'],
    'WaypointReached':
      ['Punkt pośredni'],
    'Roundabout':
      ['Wyjedź {exitStr} zjazdem na rondzie', ' na {road}'],
    'DestinationReached':
      ['Dojechano do miejsca docelowego'],
    'Fork': ['Na rozwidleniu {modifier}', ' na {road}'],
    'Merge': ['Zjedź {modifier}', ' na {road}'],
    'OnRamp': ['Wjazd {modifier}', ' na {road}'],
    'OffRamp': ['Zjazd {modifier}', ' na {road}'],
    'EndOfRoad': ['Skręć {modifier} na końcu drogi', ' na {road}'],
    'Onto': 'na {road}'
  },
  formatOrder: function (n) {
    return n + '.';
  },
  ui: {
    startPlaceholder: 'Początek',
    viaPlaceholder: 'Przez {viaNumber}',
    endPlaceholder: 'Koniec'
  },
  units: {
    meters: 'm',
    kilometers: 'km',
    yards: 'yd',
    miles: 'mi',
    hours: 'godz',
    minutes: 'min',
    seconds: 's'
  }
};

export default plLocale;