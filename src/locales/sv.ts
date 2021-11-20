import { Locale } from './types';

const svLocale: Locale = {
  directions: {
    N: 'norr',
    NE: 'nordost',
    E: 'öst',
    SE: 'sydost',
    S: 'syd',
    SW: 'sydväst',
    W: 'väst',
    NW: 'nordväst',
    SlightRight: 'svagt höger',
    Right: 'höger',
    SharpRight: 'skarpt höger',
    SlightLeft: 'svagt vänster',
    Left: 'vänster',
    SharpLeft: 'skarpt vänster',
    Uturn: 'Vänd'
  },
  instructions: {
    // instruction, postfix if the road is named
    'Head':
      ['Åk åt {dir}', ' till {road}'],
    'Continue':
      ['Fortsätt {dir}'],
    'SlightRight':
      ['Svagt höger', ' till {road}'],
    'Right':
      ['Sväng höger', ' till {road}'],
    'SharpRight':
      ['Skarpt höger', ' till {road}'],
    'TurnAround':
      ['Vänd'],
    'SharpLeft':
      ['Skarpt vänster', ' till {road}'],
    'Left':
      ['Sväng vänster', ' till {road}'],
    'SlightLeft':
      ['Svagt vänster', ' till {road}'],
    'WaypointReached':
      ['Viapunkt nådd'],
    'Roundabout':
      ['Tag {exitStr} avfarten i rondellen', ' till {road}'],
    'DestinationReached':
      ['Framme vid resans mål'],
    'Fork': ['Tag av {modifier}', ' till {road}'],
    'Merge': ['Anslut {modifier} ', ' till {road}'],
    'OnRamp': ['Tag påfarten {modifier}', ' till {road}'],
    'OffRamp': ['Tag avfarten {modifier}', ' till {road}'],
    'EndOfRoad': ['Sväng {modifier} vid vägens slut', ' till {road}'],
    'Onto': 'till {road}'
  },
  formatOrder: function (n) {
    return ['första', 'andra', 'tredje', 'fjärde', 'femte',
      'sjätte', 'sjunde', 'åttonde', 'nionde', 'tionde'
      /* Can't possibly be more than ten exits, can there? */][n - 1];
  },
  ui: {
    startPlaceholder: 'Från',
    viaPlaceholder: 'Via {viaNumber}',
    endPlaceholder: 'Till'
  }
};

export default svLocale;