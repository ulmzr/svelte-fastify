"use strict";

const fp = require("fastify-plugin");

module.exports = fp(async function (app, opts) {
   app.register(require("fastify-bcrypt"), {
      saltWorkFactor: 12,
   });
});
