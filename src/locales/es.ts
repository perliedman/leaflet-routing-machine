import { Locale } from './types';

const esLocale: Locale = {
  directions: {
    N: 'norte',
    NE: 'noreste',
    E: 'este',
    SE: 'sureste',
    S: 'sur',
    SW: 'suroeste',
    W: 'oeste',
    NW: 'noroeste',
    SlightRight: 'leve giro a la derecha',
    Right: 'derecha',
    SharpRight: 'giro pronunciado a la derecha',
    SlightLeft: 'leve giro a la izquierda',
    Left: 'izquierda',
    SharpLeft: 'giro pronunciado a la izquierda',
    Uturn: 'media vuelta'
  },
  instructions: {
    // instruction, postfix if the road is named
    'Head':
      ['Derecho {dir}', ' sobre {road}'],
    'Continue':
      ['Continuar {dir}', ' en {road}'],
    'TurnAround':
      ['Dar vuelta'],
    'WaypointReached':
      ['Llegó a un punto del camino'],
    'Roundabout':
      ['Tomar {exitStr} salida en la rotonda', ' en {road}'],
    'DestinationReached':
      ['Llegada a destino'],
    'Fork': ['En el cruce gira a {modifier}', ' hacia {road}'],
    'Merge': ['Incorpórate {modifier}', ' hacia {road}'],
    'OnRamp': ['Gira {modifier} en la salida', ' hacia {road}'],
    'OffRamp': ['Toma la salida {modifier}', ' hacia {road}'],
    'EndOfRoad': ['Gira {modifier} al final de la carretera', ' hacia {road}'],
    'Onto': 'hacia {road}'
  },
  formatOrder: function (n) {
    return n + 'º';
  },
  ui: {
    startPlaceholder: 'Inicio',
    viaPlaceholder: 'Via {viaNumber}',
    endPlaceholder: 'Destino'
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

export default esLocale;