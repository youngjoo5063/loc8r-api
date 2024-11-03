const mongoose = require('mongoose');
const dbURI = "mongodb://localhost/Loc8r";
mongoose.connect(dbURI, { useNewUrlParser: true });

mongoose.connection.on("connected", function () {
  console.log("Mongoose connected to " + dbURI);
});
mongoose.connection.on("error", function (err) {
  console.log("Mongoose connection error: " + err);
});
mongoose.connection.on("disconnected", function () {
  console.log("Mongoose disconnected");
});

const gracefulShutdown = function (msg, callback) {
  mongoose.connection.close(function () {
    console.log("Mongoose disconnected through " + msg);
    callback();
  });
};

process.once("SIGUSR2", () => {
  gracefulShutdown("nodemon restart", () => {
    process.kill(process.pid, "SIGUSR2");
  });
});

// For app termination
process.on("SIGINT", () => {
  gracefulShutdown("app termination", () => {
    process.exit(0);
  });
});

// For Heroku app terination
process.on("SIGTERM", () => {
  gracefulShutdown("Heroku app shutdown", () => {
    process.exit(0);
  });
});

require("./locations");
