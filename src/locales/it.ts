import { Locale } from './types';

const itLocale: Locale = {
  directions: {
    N: 'nord',
    NE: 'nord-est',
    E: 'est',
    SE: 'sud-est',
    S: 'sud',
    SW: 'sud-ovest',
    W: 'ovest',
    NW: 'nord-ovest'
  },
  instructions: {
    // instruction, postfix if the road is named
    'Head':
      ['Dritto verso {dir}', ' su {road}'],
    'Continue':
      ['Continuare verso {dir}', ' su {road}'],
    'SlightRight':
      ['Mantenere la destra', ' su {road}'],
    'Right':
      ['A destra', ' su {road}'],
    'SharpRight':
      ['Strettamente a destra', ' su {road}'],
    'TurnAround':
      ['Fare inversione di marcia'],
    'SharpLeft':
      ['Strettamente a sinistra', ' su {road}'],
    'Left':
      ['A sinistra', ' sur {road}'],
    'SlightLeft':
      ['Mantenere la sinistra', ' su {road}'],
    'WaypointReached':
      ['Punto di passaggio raggiunto'],
    'Roundabout':
      ['Alla rotonda, prendere la {exitStr} uscita'],
    'DestinationReached':
      ['Destinazione raggiunta'],
  },
  formatOrder: function (n) {
    return n + 'º';
  },
  ui: {
    startPlaceholder: 'Partenza',
    viaPlaceholder: 'Intermedia {viaNumber}',
    endPlaceholder: 'Destinazione'
  }
};

export default itLocale;