"use strict";

module.exports = async function (app, opts) {
   app.get("/", async function (request, reply) {
      reply.send({
         about: "example",
      });
   });
};
