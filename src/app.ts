const superagent = require("superagent");
const jayson = require("jayson");
const cors = require("cors");
const express = require("express");
const jsonParser = require("body-parser").json;

const { PORT } = process.env;
if (!PORT) {
  console.error("[EXIT] Missing PORT!");
  process.exit(0);
}

import relayFacts from "./relay-facts";
import { init } from "./utils";

async function start() {
  const account = await init();
  const app = express();
  app.get("/healthz", function fooMiddleware(req: any, res: any) {
    res.sendStatus(200);
  });
  const server = new jayson.server({
    query: async function (args: any, callback: any) {
      try {
        console.log("args", args);
        if (args.method_name === "get_facts") {
          const queries = JSON.parse(
            Buffer.from(args.args_base64, "base64").toString()
          );
          console.log("queries=", queries);
          const rawResult = await relayFacts(account, args, queries);
          return callback(null, rawResult);
        } else {
          callback(null, "Method not supported");
        }
      } catch (e) {
        callback(null, e);
      }
    },
  });

  app.use(cors({ methods: ["POST"] }));
  app.use(jsonParser());
  app.use(server.middleware());

  app.listen(PORT);
}
start();
