const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
