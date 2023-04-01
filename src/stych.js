(function () {
  "use strict";

  var L = require("leaflet");

  var OSRMSTYCHv1 = require("./osrmstych-v1");

  /**
   * Works against OSRM's new API in version 5.0; this has
   * the API version v1.
   */
  module.exports = OSRMSTYCHv1.extend({
    options: {
      serviceUrl: "",
      profile: "driving",
      useHints: false,
    },

    initialize: function (
      accessToken,
      options
    ) {
      L.Routing.OSRMSTYCHv1.prototype.initialize.call(
        this,
        options
      );
      this.options.requestParameters =
        this.options
          .requestParameters || {};
      /* jshint camelcase: false */
      this.options.requestParameters.access_token =
        accessToken;
      /* jshint camelcase: true */
    },
  });
})();
