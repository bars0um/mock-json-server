const express = require("express");
const _ = require("lodash");
const cors = require("cors");
const enableDestroy = require("server-destroy");
const fs = require("fs-extra");
const chalk = require("chalk");
const moment = require("moment");

let server = null;
let app = null;

const methods = ["get", "post", "put", "delete"];
const isDebug = process.env.DEBUG || false;

const log = data => {
  if (!process.env.NO_OUTPUT) {
    console.log(data);
  }
};

function logger(req, res, next) {
  log(
    moment.utc().format() +
      " : " +
      chalk.yellow("[" + req.method + "] " + req.url)
  );
  next();
}

const start = async (source, port) => {
  app = express();
  app.use(cors());
  app.use(logger);
  app.locals = {
    _: _
  };
  app.set("views", __dirname + "/pages");
  app.set("view engine", "ejs");
  const sources = await getSource(source);
  _makeRoutes(sources);
  _makeHome(port, sources);
};

const getSource = async source => {
  try {
    const data = await fs.readFile(source, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    log(chalk.red(`Could not read source file.\n${e.message}`));
    if (isDebug) {
      console.log(e);
    }
    process.exit(1);
  }
};

const listen = (port, callback) => {
  server = app.listen(port, function() {
    callback();
  });
  enableDestroy(server);
};

const end = () => {
  server.destroy();
};

function _makeRoutes(source) {
  _.each(source, function(value, path) {
    _.each(value, function(a, method) {
      if (_.includes(methods, method)) {
        app[method](path, function(req, res) {
          res.jsonp(a);
        });
      }
    });
  });
}

function _makeHome(port, source) {
  app.get("/", function(req, res) {
    res.render("index", {
      port: port,
      database: source
    });
  });
}

module.exports = function(source, port) {
  return {
    start: async () => {
      try {
        await start(source, port);
        listen(port, function() {
          log(
            chalk.green("JSON Server running at http://localhost:" + port + "/")
          );
          return true;
        });
      } catch (e) {
        log(chalk.red("Could not start mock server."));
        if (isDebug) {
          log(e);
        }
        process.exit(1);
      }
    },
    reload: async () => {
      try {
        end();
        await start(source, port);
        listen(port, function() {
          log(
            chalk.green("JSON Server running at http://localhost:" + port + "/")
          );
        });
      } catch (e) {
        log(chalk.red("There was an error reloading the app."));
        if (isDebug) {
          log(e);
        }
        process.exit(1);
      }
    },
    stop: () => {
      end();
    }
  };
};
