import { Locale } from './types';

const elLocale: Locale = {
  directions: {
    N: 'βόρεια',
    NE: 'βορειοανατολικά',
    E: 'ανατολικά',
    SE: 'νοτιοανατολικά',
    S: 'νότια',
    SW: 'νοτιοδυτικά',
    W: 'δυτικά',
    NW: 'βορειοδυτικά'
  },
  instructions: {
    // instruction, postfix if the road is named
    'Head':
      ['Κατευθυνθείτε {dir}', ' στην {road}'],
    'Continue':
      ['Συνεχίστε {dir}', ' στην {road}'],
    'SlightRight':
      ['Ελαφρώς δεξιά', ' στην {road}'],
    'Right':
      ['Δεξιά', ' στην {road}'],
    'SharpRight':
      ['Απότομη δεξιά στροφή', ' στην {road}'],
    'TurnAround':
      ['Κάντε αναστροφή'],
    'SharpLeft':
      ['Απότομη αριστερή στροφή', ' στην {road}'],
    'Left':
      ['Αριστερά', ' στην {road}'],
    'SlightLeft':
      ['Ελαφρώς αριστερά', ' στην {road}'],
    'WaypointReached':
      ['Φτάσατε στο σημείο αναφοράς'],
    'Roundabout':
      ['Ακολουθήστε την {exitStr} έξοδο στο κυκλικό κόμβο', ' στην {road}'],
    'DestinationReached':
      ['Φτάσατε στον προορισμό σας'],
  },
  formatOrder: function (n) {
    return n + 'º';
  },
  ui: {
    startPlaceholder: 'Αφετηρία',
    viaPlaceholder: 'μέσω {viaNumber}',
    endPlaceholder: 'Προορισμός'
  }
};

export default elLocale;