const Transaction = require('./transaction');
const { STARTING_BALANCE } = require('../util/config');
const { ec, cryptoHash, hexToKeyPair, keypairToHex, keypairToMemoryPhrase } = require('../util/crypto');



class Wallet {
  constructor({private_key}) {

    if(private_key && private_key != ""){
      try {
        this.keyPair = hexToKeyPair(private_key);
      } catch (error) {
        console.error(`InputKeyPair ${private_key} was an error`)
        this.keyPair = ec.genKeyPair();
      }
    } else {
      this.keyPair = ec.genKeyPair();
    }
    this.balance = STARTING_BALANCE;
    this.publicKey = this.keyPair.getPublic().encode('hex');

  }

  getPrivateKey(){
    return keypairToHex(this.keyPair);
  }

  getMemoryPhrase(){
    return keypairToMemoryPhrase(this.keyPair);
  }


  sign(data) {
    return this.keyPair.sign(cryptoHash(data))
  }

  createTransaction({ recipient, amount, chain }) {
    if (chain) {
      this.balance = Wallet.calculateBalance({
        chain,
        address: this.publicKey
      });
    }

    if (amount > this.balance) {
      throw new Error('Amount exceeds balance');
    }

    return new Transaction({ senderWallet: this, recipient, amount });
  }

  static calculateBalance({ chain, address }) {
    let hasConductedTransaction = false;
    let outputsTotal = 0;

    for (let i=chain.length-1; i>0; i--) {
      const block = chain[i];

      for (let transaction of block.data) {
        if (transaction.input.address === address) {
          hasConductedTransaction = true;
        }

        const addressOutput = transaction.outputMap[address];

        if (addressOutput) {
          outputsTotal = outputsTotal + addressOutput;
        }
      }

      if (hasConductedTransaction) {
        break;
      }
    }

    return hasConductedTransaction ? outputsTotal : STARTING_BALANCE + outputsTotal;
  }
};

module.exports = Wallet;