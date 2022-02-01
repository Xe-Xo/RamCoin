const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const path = require('path');

const Blockchain = require('./blockchain/blockchain');
const TransactionPool = require('./blockchain/transaction-pool');
const Transaction = require('./blockchain/transaction');
const Wallet = require('./blockchain/wallet');

const PubSub = require('./networking/pubsub');

const blockchain = new Blockchain({});
const transactionPool = new TransactionPool();
const wallet = new Wallet({privatekey: ""});

const pubsub = new PubSub(blockchain, transactionPool, wallet);

//const app = express();

//app.use(bodyParser.json());

pubsub.update_external_address().then(startup()).catch(error => console.error("Couldnt find external", error));

function mine(){
    console.log("mining block")  
    const validTransactions = transactionPool.validTransactions();
    
    validTransactions.push(
        Transaction.rewardTransaction({ minerWallet: wallet })
    );

    blockchain.mineBlock({ data: validTransactions });

    pubsub.sendNewBlock(blockchain.chain[blockchain.chain.length-1]);

    transactionPool.clear();
}


function startup(){


    setInterval(function() {
        try {
            
            pubsub.sendNodeHeartBeat();
            console.log("sent HeartBeat");  
            console.log(pubsub.aliveNodes);
        
        } catch (error) {
            console.error(error);
        }
        
    },1*60*1000);
    
    setInterval(function() {
        mine()
    }, 5*60*1000)



}

