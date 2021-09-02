const superagent = require("superagent");
const jayson = require("jayson");
const cors = require("cors");
const connect = require("connect");
const jsonParser = require("body-parser").json;

import relayFacts from "./relay-facts";
import { init } from "./utils";

async function start() {
  const account = await init();
  const app = connect();

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
          callback(null, "Mathod not supported");
        }
      } catch (e) {
        callback(null, e);
      }
    },
  });

  app.use(cors({ methods: ["POST"] }));
  app.use(jsonParser());
  app.use(server.middleware());

  app.listen(9000);
}
start();
