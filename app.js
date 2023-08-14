const path = require("node:path");
const cwd = process.cwd();
const watch = process.argv.includes("-w");

const start = () => {
   let server = require("child_process").spawn("node", [path.join(cwd, "server.js"), "--", `-w`], {
      stdio: ["ignore", "inherit", "inherit"],
      shell: true,
   });
   if (watch) server.on("close", start);
};

start();
