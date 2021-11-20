import { Locale } from './types';

const skLocale: Locale = {
  directions: {
    N: 'sever',
    NE: 'serverovýchod',
    E: 'východ',
    SE: 'juhovýchod',
    S: 'juh',
    SW: 'juhozápad',
    W: 'západ',
    NW: 'serverozápad'
  },
  instructions: {
    // instruction, postfix if the road is named
    'Head':
      ['Mierte na {dir}', ' na {road}'],
    'Continue':
      ['Pokračujte na {dir}', ' na {road}'],
    'SlightRight':
      ['Mierne doprava', ' na {road}'],
    'Right':
      ['Doprava', ' na {road}'],
    'SharpRight':
      ['Prudko doprava', ' na {road}'],
    'TurnAround':
      ['Otočte sa'],
    'SharpLeft':
      ['Prudko doľava', ' na {road}'],
    'Left':
      ['Doľava', ' na {road}'],
    'SlightLeft':
      ['Mierne doľava', ' na {road}'],
    'WaypointReached':
      ['Ste v prejazdovom bode.'],
    'Roundabout':
      ['Odbočte na {exitStr} výjazde', ' na {road}'],
    'DestinationReached':
      ['Prišli ste do cieľa.'],
  },
  formatOrder: function (n) {
    const i = n % 10 - 1,
      suffix = ['.', '.', '.'];

    return suffix[i] ? n + suffix[i] : n + '.';
  },
  ui: {
    startPlaceholder: 'Začiatok',
    viaPlaceholder: 'Cez {viaNumber}',
    endPlaceholder: 'Koniec'
  }
};

export default skLocale;