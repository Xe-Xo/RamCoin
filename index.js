const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const path = require('path');

const Blockchain = require('./blockchain/blockchain');
const TransactionPool = require('./blockchain/transaction-pool');
const Wallet = require('./blockchain/wallet');
const P2PNode = require('./networking/p2pnode');
const {NodeFinder} = require('./networking/nodefinder');

(async() => {

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

const blockchain = new Blockchain({});
const transactionPool = new TransactionPool();
const wallet = new Wallet({privatekey: ""});
const p2pserver = new P2PNode(blockchain, transactionPool, wallet);
let nodefinder = null;

await p2pserver.create()
nodefinder = new NodeFinder({p2pNode: p2pserver});
nodefinder.broadcastAddress();


const app = express();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

app.get('/api/blocks', (req, res) => {
    res.json(blockchain.chain);
});

app.get('/api/blocks/length', (req, res) => {
    res.json(blockchain.chain.length);
});

app.get('/api/blocks/:id', (req, res) => {
    const { id } = req.params;
    const { length } = blockchain.chain;

    const blocksReversed = blockchain.chain.slice().reverse();

    let startIndex = (id-1) * 5;
    let endIndex = id * 5;

    startIndex = startIndex < length ? startIndex : length;
    endIndex = endIndex < length ? endIndex : length;

    res.json(blocksReversed.slice(startIndex, endIndex));
});

app.post('/api/transaction', (req, res) => {
    const { amount, recipient } = req.body;

    let transaction = transactionPool
        .existingTransaction({ inputAddress: wallet.publicKey });

    try {
        if (transaction) {
        transaction.update({ senderWallet: wallet, recipient, amount });
        } else {
        transaction = wallet.createTransaction({
            recipient,
            amount,
            chain: blockchain.chain
        });
        }
    } catch(error) {
        return res.status(400).json({ type: 'error', message: error.message });
    }

    transactionPool.setTransaction(transaction);

    //pubsub.broadcastTransaction(transaction);

    res.json({ type: 'success', transaction });
    });

    app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);
    });

    app.get('/api/wallet-info', (req, res) => {
    const address = wallet.publicKey;

    res.json({
        address,
        balance: Wallet.calculateBalance({ chain: blockchain.chain, address })
    });
});

app.get('/api/known-addresses', (req, res) => {
    const addressMap = {};

    for (let block of blockchain.chain) {
        for (let transaction of block.data) {
        const recipient = Object.keys(transaction.outputMap);

        recipient.forEach(recipient => addressMap[recipient] = recipient);
        }
    }

    res.json(Object.keys(addressMap));
});

app.get('/api/known-balances', (req, res) => {
    const balanceMap = [];
    const addressMap = new Set();

    for (let block of blockchain.chain) {
        for (let transaction of block.data) {
        const recipients = Object.keys(transaction.outputMap);

        recipients.forEach(recipient => addressMap.add(recipient));
        }
    }

    const addresslist = Array.from(addressMap);

    for (var index = 0; index < addresslist.length; index++) {
        var address = addresslist[index]
        var balancecalc = Wallet.calculateBalance({ chain: blockchain.chain, address })
        balanceMap.push({address: addresslist[index], balance: balancecalc })
    }
    res.json(balanceMap);
});


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const syncWithRootState = () => {
    request({ url: `${ROOT_NODE_ADDRESS}/blocks` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
        const rootChain = JSON.parse(body);
        console.log('replace chain on a sync with', rootChain);
        blockchain.replaceChain(rootChain,true);
    }
    });

    request({ url: `${ROOT_NODE_ADDRESS}/transaction-pool-map` }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
        const rootTransactionPoolMap = JSON.parse(body);

        console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
        transactionPool.setMap(rootTransactionPoolMap);
    }
    });
};

const PORT = process.env.PORT || DEFAULT_PORT;

app.listen(PORT, () => {
    console.log(`Listening for API on: ${PORT}`);

    if (PORT !== DEFAULT_PORT) {
        syncWithRootState();
    }
});

setInterval(async function() {
    try {
        let peerId = p2pserver.libp2p.peerId.toB58String()
        await p2pserver.sendMessage("MESSAGE",peerId);
    } catch (error) {
        console.error(error);
    }
    
},15000);


})()


