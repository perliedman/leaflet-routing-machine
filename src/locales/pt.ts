import { Locale } from './types';

const ptLocale: Locale = {
  directions: {
    N: 'norte',
    NE: 'nordeste',
    E: 'leste',
    SE: 'sudeste',
    S: 'sul',
    SW: 'sudoeste',
    W: 'oeste',
    NW: 'noroeste',
    SlightRight: 'curva ligeira a direita',
    Right: 'direita',
    SharpRight: 'curva fechada a direita',
    SlightLeft: 'ligeira a esquerda',
    Left: 'esquerda',
    SharpLeft: 'curva fechada a esquerda',
    Uturn: 'Meia volta'
  },
  instructions: {
    // instruction, postfix if the road is named
    'Head':
      ['Siga {dir}', ' na {road}'],
    'Continue':
      ['Continue {dir}', ' na {road}'],
    'SlightRight':
      ['Curva ligeira a direita', ' na {road}'],
    'Right':
      ['Curva a direita', ' na {road}'],
    'SharpRight':
      ['Curva fechada a direita', ' na {road}'],
    'TurnAround':
      ['Retorne'],
    'SharpLeft':
      ['Curva fechada a esquerda', ' na {road}'],
    'Left':
      ['Curva a esquerda', ' na {road}'],
    'SlightLeft':
      ['Curva ligueira a esquerda', ' na {road}'],
    'WaypointReached':
      ['Ponto de interesse atingido'],
    'Roundabout':
      ['Pegue a {exitStr} saída na rotatória', ' na {road}'],
    'DestinationReached':
      ['Destino atingido'],
    'Fork': ['Na encruzilhada, vire a {modifier}', ' na {road}'],
    'Merge': ['Entre à {modifier}', ' na {road}'],
    'OnRamp': ['Vire {modifier} na rampa', ' na {road}'],
    'OffRamp': ['Entre na rampa na {modifier}', ' na {road}'],
    'EndOfRoad': ['Vire {modifier} no fim da rua', ' na {road}'],
    'Onto': 'na {road}'
  },
  formatOrder: function (n) {
    return n + 'º';
  },
  ui: {
    startPlaceholder: 'Origem',
    viaPlaceholder: 'Intermédio {viaNumber}',
    endPlaceholder: 'Destino'
  }
};

export default ptLocale;