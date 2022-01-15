const MINE_RATE = 5 * 60 * 1000; //1 RamCoin per 5 Minutes
const INITIAL_DIFFICULTY = 10;

const GENESIS_DATA = {
  timestamp: 1,
  lastHash: '-----',
  hash: 'hash-one',
  difficulty: INITIAL_DIFFICULTY,
  nonce: 0,
  data: []
};

const STARTING_BALANCE = 0;
const TRANSACTION_FEE = 1;
const MINING_REWARD = 1;

const REWARD_INPUT = { address: '*authorized-reward*' };

module.exports = {
  GENESIS_DATA,
  MINE_RATE,
  STARTING_BALANCE,
  REWARD_INPUT,
  TRANSACTION_FEE,
  MINING_REWARD
};