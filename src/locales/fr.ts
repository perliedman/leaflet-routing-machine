import { Locale } from './types';

const frLocale: Locale = {
  directions: {
    N: 'nord',
    NE: 'nord-est',
    E: 'est',
    SE: 'sud-est',
    S: 'sud',
    SW: 'sud-ouest',
    W: 'ouest',
    NW: 'nord-ouest'
  },
  instructions: {
    // instruction, postfix if the road is named
    'Head':
      ['Tout droit au {dir}', ' sur {road}'],
    'Continue':
      ['Continuer au {dir}', ' sur {road}'],
    'SlightRight':
      ['Légèrement à droite', ' sur {road}'],
    'Right':
      ['A droite', ' sur {road}'],
    'SharpRight':
      ['Complètement à droite', ' sur {road}'],
    'TurnAround':
      ['Faire demi-tour'],
    'SharpLeft':
      ['Complètement à gauche', ' sur {road}'],
    'Left':
      ['A gauche', ' sur {road}'],
    'SlightLeft':
      ['Légèrement à gauche', ' sur {road}'],
    'WaypointReached':
      ['Point d\'étape atteint'],
    'Roundabout':
      ['Au rond-point, prenez la {exitStr} sortie', ' sur {road}'],
    'DestinationReached':
      ['Destination atteinte'],
  },
  formatOrder: function (n) {
    return n + 'º';
  },
  ui: {
    startPlaceholder: 'Départ',
    viaPlaceholder: 'Intermédiaire {viaNumber}',
    endPlaceholder: 'Arrivée'
  }
};

export default frLocale;