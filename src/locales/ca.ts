import { Locale } from './types';

const caLocale: Locale = {
  directions: {
    N: 'nord',
    NE: 'nord-est',
    E: 'est',
    SE: 'sud-est',
    S: 'sud',
    SW: 'sud-oest',
    W: 'oest',
    NW: 'nord-oest',
    SlightRight: 'lleu gir a la dreta',
    Right: 'dreta',
    SharpRight: 'gir pronunciat a la dreta',
    SlightLeft: 'gir pronunciat a l\'esquerra',
    Left: 'esquerra',
    SharpLeft: 'lleu gir a l\'esquerra',
    Uturn: 'mitja volta'
  },
  instructions: {
    'Head':
      ['Recte {dir}', ' sobre {road}'],
    'Continue':
      ['Continuar {dir}'],
    'TurnAround':
      ['Donar la volta'],
    'WaypointReached':
      ['Ha arribat a un punt del camí'],
    'Roundabout':
      ['Agafar {exitStr} sortida a la rotonda', ' a {road}'],
    'DestinationReached':
      ['Arribada al destí'],
    'Fork': ['A la cruïlla gira a la {modifier}', ' cap a {road}'],
    'Merge': ['Incorpora\'t {modifier}', ' a {road}'],
    'OnRamp': ['Gira {modifier} a la sortida', ' cap a {road}'],
    'OffRamp': ['Pren la sortida {modifier}', ' cap a {road}'],
    'EndOfRoad': ['Gira {modifier} al final de la carretera', ' cap a {road}'],
    'Onto': 'cap a {road}'
  },
  formatOrder: function (n) {
    return n + 'º';
  },
  ui: {
    startPlaceholder: 'Origen',
    viaPlaceholder: 'Via {viaNumber}',
    endPlaceholder: 'Destí'
  },
  units: {
    meters: 'm',
    kilometers: 'km',
    yards: 'yd',
    miles: 'mi',
    hours: 'h',
    minutes: 'min',
    seconds: 's'
  }
};

export default caLocale;