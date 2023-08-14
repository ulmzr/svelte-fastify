"use strict";

const fp = require("fastify-plugin");

module.exports = fp(async function (app, opts) {
   app.decorate("copyright", "@Copyright 2023, Gresik 2023");
});
