require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");

const fastify = require("fastify");
const autoload = require("@fastify/autoload");

const mimeType = require("./mime");
const chokidar = require("chokidar");

const cwd = process.cwd();
const watch = process.argv.includes("-w");

const port = process.env.PORT;
const outdir = process.env.OUTDIR;

// const pino = require("pino");
// const logger = pino({
//    transport: {
//       target: "pino-pretty",
//       options: {
//          colorize: true,
//       },
//    },
// });

const app = fastify({
   logger: {
      level: "warn",
   },
});

if (watch) {
   // for spa handler
   let indexFilepath = path.join(cwd, "public", "index.html");
   let indexFile;
   if (fs.existsSync(indexFilepath)) indexFile = fs.readFileSync(indexFilepath, "utf8");
   else indexFile = `<html><head><script defer src="/main.js"></script></head><body></body></html>`;
   indexFile = indexFile.replace(
      "</head>",
      `<script>let u="ws://localhost:1969";w=new WebSocket(u);w.onclose=_=>{let s=_=>{w=new WebSocket(u);w.onerror=_=>setTimeout(s,2e3);w.onopen=_=>location.reload()};s()};w.onmessage=_=>location.reload()</script></head>`
   );
   app.addHook("onRequest", async (request, reply) => {
      let url = request.url.replace(/[\#\?].*$/, "");
      if (url.startsWith("/api")) return;
      url = url.endsWith("/") ? url + "index.html" : url;
      //
      let mime = mimeType(url);
      let isIndex = [url === "/", url.endsWith("index.html")].some((x) => x);
      let filename = path.join(cwd, outdir, url);
      let content = indexFile;
      let code = "200";

      if (!isIndex) {
         if (fs.existsSync(filename)) content = fs.readFileSync(filename);
         else code = 404;
      }
      if (watch) console.log(code == "200" ? code : 404, url);
      reply.type(mime).send(content);
   });
}

app.register(autoload, {
   dir: path.join(cwd, "api", "plugins"),
});

app.register(autoload, {
   dir: path.join(__dirname, "api", "routes"),
   options: { prefix: "/api" },
});

async function start() {
   let ip = require("ip").address();
   try {
      console.log(`Server run on http://${ip}:${port}\n`);
      await app.listen({ port });
      if (watch) watching();
   } catch (err) {
      app.log.error(err);
      process.exit(1);
   }
   build();
}

async function build() {
   const esbuild = require("esbuild");
   const sveltePlugin = require("esbuild-svelte");
   const { sassPlugin } = require("@jgoz/esbuild-plugin-sass");
   const inlineImage = require("esbuild-plugin-inline-image");
   //
   const ctx = await esbuild.context({
      entryPoints: ["src/main.js"],
      mainFields: ["svelte", "browser", "module", "main"],
      conditions: ["svelte", "browser"],
      bundle: true,
      minify: !watch,
      // format: "iife",
      outdir,
      plugins: [
         sveltePlugin({
            compilerOptions: {
               css: "external",
            },
         }),
         sassPlugin(),
         inlineImage(),
      ],
   });
   ctx.watch();
   if (!watch) ctx.dispose();
}

function watching() {
   // watch fastify source
   chokidar
      .watch("api", {
         ignored: /(^|[\/\\])\../,
         persistent: true,
         cwd,
      })
      .on("change", function (path) {
         console.log(`\nChange on: ${path}.\nReload Server...!\n`);
         process.exit();
      });

   // Start websocket
   const { WebSocketServer } = require("ws");
   const wss = new WebSocketServer({ port: 1969 });
   wss.on("connection", function connection(ws) {
      let timer;

      const startTimer = () => {
         timer = setTimeout(() => {
            ws.send("reload");
         }, 300);
      };

      const reload = () => {
         clearTimeout(timer);
         startTimer();
      };

      ws.on("error", console.error);

      chokidar
         .watch(outdir, {
            ignored: /(^|[\/\\])\../,
            persistent: true,
            cwd,
         })
         .on("change", () => reload());
   });
}

start();
