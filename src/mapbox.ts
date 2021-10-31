import OSRMv1, { OSRMv1Options } from './osrm-v1';

export default class Mapbox extends OSRMv1 {
  options: OSRMv1Options = {
    serviceUrl: 'https://api.mapbox.com/directions/v5',
    profile: 'mapbox/driving',
    useHints: false,
    requestParameters: {},
  }

  constructor(accessToken: string, options?: OSRMv1Options) {
    super(options);

    this.options.requestParameters = this.options.requestParameters || {};
    this.options.requestParameters.access_token = accessToken;
  }
}

export function mapbox(accessToken: string, options?: OSRMv1Options) {
  return new Mapbox(accessToken, options);
}