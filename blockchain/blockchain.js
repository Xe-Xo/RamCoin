const Block = require('./block');

class Blockchain {
  constructor({blockchain}) {
    if (blockchain && Blockchain.isValidChain(blockchain)){
      this.chain = blockchain;
    }else{
      this.chain = [Block.genesis()];
    }
  }

  mineBlock({ data }) {


    let lastHash = this.chain[this.chain.length-1].hash;
    let hash, timestamp;
    let { difficulty } = this.chain[this.chain.length-1];
    let nonce = 0;

    do {
      //Check that the lastHash is still correct.
      if(lastHash != this.chain[this.chain.length-1].hash){
        console.log("Previous Chain Has Changed")
        newblock = true;
        nonce = 0;
        difficulty = this.chain[this.chain.length-1].difficulty;
      }
      //Move On
      nonce++;
      timestamp = Date.now();
      difficulty = Block.adjustDifficulty({ originalBlock: this.chain[this.chain.length-1], timestamp });
      hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
    } while (
      hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty)
    );

    const newBlock = new Block({ timestamp, lastHash, data, difficulty, nonce, hash });
    this.chain.push(newBlock);
  }

  replaceChain(chain, validateTransactions, onSuccess) {

    if (chain.length < this.chain.length) {
      console.error(`NEW CHAIN FAILED: The incoming chain is smaller ${chain.length}<${this.chain.length}`);
      return;
    } else if (chain.length == this.chain.length) {
      console.error(`NEW CHAIN FAILED: The incoming chain is the same ${chain.length}=${this.chain.length}`);
      return;
    } else {
      console.log(`NEW CHAIN SUCCESS: The incoming chain is longer ${chain.length}>${this.chain.length}`);
    }

    if (!Blockchain.isValidChain(chain)) {
      console.error('The incoming chain must be valid');
      return;
    } else {
      //console.log(`NEW CHAIN SUCCESS: The incoming chain is valid (genesis block is correct)`);
    }

    if (validateTransactions && !this.validTransactionData({ chain })) {
      console.error('The incoming chain has invalid data');
      return;
    } else {
      //console.log(`NEW CHAIN SUCCESS: the chain has valid data`);
    }

    if (onSuccess) {
      onSuccess();
    }
    console.log(`replacing chain length ${this.chain.length} with length ${chain.length}`);
    this.chain = chain;
  }

  validTransactionData({ chain }) {
    for (let i=1; i<chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set();
      let rewardTransactionCount = 0;

      for (let transaction of block.data) {
        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount += 1;

          if (rewardTransactionCount > 1) {
            console.error('Miner rewards exceed limit');
            return false;
          }

          if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
            console.error('Miner reward amount is invalid');
            return false;
          }
        } else {
          if (!Transaction.validTransaction(transaction)) {
            console.error('Invalid transaction');
            return false;
          }

          const trueBalance = Wallet.calculateBalance({
            chain: this.chain,
            address: transaction.input.address
          });

          if (transaction.input.amount !== trueBalance) {
            console.error('Invalid input amount');
            return false;
          }

          if (transactionSet.has(transaction)) {
            console.error('An identical transaction appears more than once in the block');
            return false;
          } else {
            transactionSet.add(transaction);
          }
        }
      }
    }

    return true;
  }

  static isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
      console.log("not valid chain because starting block is not genesis");
      console.error(JSON.stringify(chain[0]));
      return false;
    };

    for (let i=1; i<chain.length; i++) {
      const { timestamp, lastHash, hash, nonce, difficulty, data } = chain[i];
      const actualLastHash = chain[i-1].hash;
      const lastDifficulty = chain[i-1].difficulty;

      if (lastHash !== actualLastHash) {
        console.log(`not valid chain because block-${i} hash did not agree with previous Hash`)
        return false
      };
      const validatedHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);

      if (hash !== validatedHash){
        console.log(`not valid chain because block-${i} hash was not valid`)
        return false
      };

      if (Math.abs(lastDifficulty - difficulty) > 1){
        console.log(`not valid chain because block-${i} hash was not valid`)
        return false
      };
    }

    return true;
  }
}

module.exports = Blockchain;