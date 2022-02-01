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

setInterval(async function() {
    try {
        
        await pubsub.sendNodeHeartBeat();
        console.log("sent HeartBeat")
    
    } catch (error) {
        console.error(error);
    }
    
},15000);