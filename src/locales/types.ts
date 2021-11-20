interface TurnDirections {
  SlightRight?: string | string[];
  SlightLeft?: string | string[];
  SharpRight?: string | string[];
  SharpLeft?: string | string[];
  Right?: string | string[];
  Left?: string | string[];
  Uturn?: string | string[];
}

interface Directions extends TurnDirections {
  N: string;
  NE: string;
  E: string;
  SE: string;
  S: string;
  SW: string;
  W: string;
  NW: string;
}

interface Instructions extends TurnDirections {
  Head?: string[];
  Continue?: string[];
  TurnAround?: string[];
  WaypointReached?: string[];
  Roundabout?: string[];
  DestinationReached?: string[];
  Fork?: string[];
  Merge?: string[];
  OnRamp?: string[];
  OffRamp?: string[];
  EndOfRoad?: string[];
  Onto?: string;
}

interface UI {
  startPlaceholder: string;
  viaPlaceholder: string;
  endPlaceholder: string;
}

export interface Units {
  meters: string;
  kilometers: string;
  yards: string;
  miles: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export interface Locale {
  directions: Directions;
  instructions: Instructions;
  formatOrder: (n: number) => string,
  ui: UI;
  units?: Units;
}