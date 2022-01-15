const hexToBinary = require('hex-to-binary');
const { GENESIS_DATA, MINE_RATE } = require('../util/config');
const { cryptoHash } = require('../util/crypto');

class Block {
  constructor({ timestamp, lastHash, hash, data, nonce, difficulty }) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data;
    this.nonce = nonce;
    this.difficulty = difficulty;
  }

  static genesis() {
    return new this(GENESIS_DATA);
  }

  static adjustDifficulty({ originalBlock, timestamp }) {
    const { difficulty } = originalBlock;

    if (difficulty < 1) return 1;

    if ((timestamp - originalBlock.timestamp) > MINE_RATE ) return difficulty - 1;

    return difficulty + 1;
  }
}

module.exports = Block;