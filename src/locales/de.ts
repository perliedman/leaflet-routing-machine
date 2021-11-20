import { Locale } from './types';

const deLocale: Locale = {
  directions: {
    N: 'Norden',
    NE: 'Nordosten',
    E: 'Osten',
    SE: 'Südosten',
    S: 'Süden',
    SW: 'Südwesten',
    W: 'Westen',
    NW: 'Nordwesten',
    SlightRight: 'leicht rechts',
    Right: 'rechts',
    SharpRight: 'scharf rechts',
    SlightLeft: 'leicht links',
    Left: 'links',
    SharpLeft: 'scharf links',
    Uturn: 'Wenden'
  },
  instructions: {
    // instruction, postfix if the road is named
    'Head':
      ['Richtung {dir}', ' auf {road}'],
    'Continue':
      ['Geradeaus Richtung {dir}', ' auf {road}'],
    'SlightRight':
      ['Leicht rechts abbiegen', ' auf {road}'],
    'Right':
      ['Rechts abbiegen', ' auf {road}'],
    'SharpRight':
      ['Scharf rechts abbiegen', ' auf {road}'],
    'TurnAround':
      ['Wenden'],
    'SharpLeft':
      ['Scharf links abbiegen', ' auf {road}'],
    'Left':
      ['Links abbiegen', ' auf {road}'],
    'SlightLeft':
      ['Leicht links abbiegen', ' auf {road}'],
    'WaypointReached':
      ['Zwischenhalt erreicht'],
    'Roundabout':
      ['Nehmen Sie die {exitStr} Ausfahrt im Kreisverkehr', ' auf {road}'],
    'DestinationReached':
      ['Sie haben ihr Ziel erreicht'],
    'Fork': ['An der Kreuzung {modifier}', ' auf {road}'],
    'Merge': ['Fahren Sie {modifier} weiter', ' auf {road}'],
    'OnRamp': ['Fahren Sie {modifier} auf die Auffahrt', ' auf {road}'],
    'OffRamp': ['Nehmen Sie die Ausfahrt {modifier}', ' auf {road}'],
    'EndOfRoad': ['Fahren Sie {modifier} am Ende der Straße', ' auf {road}'],
    'Onto': 'auf {road}'
  },
  formatOrder: function (n) {
    return n + '.';
  },
  ui: {
    startPlaceholder: 'Start',
    viaPlaceholder: 'Via {viaNumber}',
    endPlaceholder: 'Ziel'
  }
};

export default deLocale;