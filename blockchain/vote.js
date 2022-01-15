const { verifySignature } = require("../util");
const Blockchain = require("./blockchain");

class Vote{
    constructor({newBlock, blockchain, wallet}){
        this.block = newBlock;
        this.publicKey = wallet.publicKey;
        this.decision = Vote.castVote({newBlock, blockchain})
        this.signature = this.wallet.sign({block: this.block, decision: this.decision})
    }

    static castVote({newBlock, blockchain}){
        let newchain = blockchain.chain;
        newchain.push(newBlock);
        return Blockchain.isValidChain(newchain)
    }

    static verifyVote({vote}){
        return verifySignature({publicKey: vote.publicKey, data: {block: vote.block, decision: vote.decision}})
    }

};

module.exports = Vote