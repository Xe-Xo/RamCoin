try {
  config = require("./config.json");
} catch (error) {
  config = null;
}

exports.PEERS = config ? config.PEERS : process.env.PEERS;
exports.P2P_PORT = config ? config.P2P_PORT : process.env.PEERS;

