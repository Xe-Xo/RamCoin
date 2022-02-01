const PubNub = require('pubnub');
const { v4: uuidv4 } = require('uuid')
const fetch = require('node-fetch');
const {credentials} = require('./credentials');




const PUBNUB_CHANNELS = {
    TEST: 'TEST',
    NODE_HEARTBEAT: 'NODE_HEARTBEAT', // send external IP, blockchain size
    NEW_BLOCK: 'NEW_BLOCK', // send a new block made to the network
    NEW_TRANSACTION: 'NEW_TRANSACTION' //send a new transaction to the network
};

class PubSub {
    constructor(blockchain, transactionPool, wallet) {
        this.uuid = uuidv4();
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.aliveNodes = new Map();
        this.pubnub = new PubNub(credentials);
        this.pubnub.subscribe({ channels: Object.values(PUBNUB_CHANNELS)});
        this.external_address = "";
        this.pubnub.addListener({
            message: function(m) {
                // handle message
                var channelName = m.channel; // The channel to which the message was published
                var channelGroup = m.subscription; // The channel group or wildcard subscription match (if exists)
                var pubTT = m.timetoken; // Publish timetoken
                var msg = m.message; // The Payload
                var publisher = m.publisher; //The Publisher
                console.log(`Message received. Channel: ${channelName}. Message: ${msg}`);
                let parsedMessage = JSON.parse(msg);
                switch(channelName) {
                    case PUBNUB_CHANNELS.NODE_HEARTBEAT:
                        this.onNodeHeartBeat(parsedMessage);                
                        break;
                    case PUBNUB_CHANNELS.TEST:
                        break
                    case PUBNUB_CHANNELS.NEW_BLOCK:                 
                        break;
                    case PUBNUB_CHANNELS.NEW_TRANSACTION:
                        break;      
                    default:
                        break;
                  }
            }
            }
        );

    }


    async update_external_address(){
        const external_json = await fetch('https://httpbin.org/ip').then(response => response.json());
        this.external_address = external_json.origin;
    }


    onNodeHeartBeat(message){
        console.log(message);
        if (uuid === this.uuid) {
            return; //Dont do anything on our own heartbeat
        }

        this.updateAliveNode({uuid: message.uuid, external_address: message.external_address, wallet_public: message.wallet_public})
    }

    sendNodeHeartBeat(){

        
        //console.log(`My external IP is ${external_json.origin}`)

        this.pubnub.publish({
            channel: PUBNUB_CHANNELS.NODE_HEARTBEAT,
            message: JSON.stringify({
                uuid: this.uuid,
                wallet_public: this.wallet.publicKey,
                block_length: this.blockchain.chain.length,
                external_address: this.external_address,
                time_sent: Date.now()
            })
          });

    }

    onNewBlock(message){
        return;
    }

    onNewTransaction(message){
        return;
    }

    sendNewBlock(){
        this.pubnub.publish({
            channel: PUBNUB_CHANNELS.NEW_BLOCK,
            message: JSON.stringify({
                block:  this.blockchain.chain[ this.blockchain.chain.length - 1],
                wallet_public: this.wallet.publicKey,
                block_length: this.blockchain.chain.length,
                external_address: this.external_address,
                time_sent: Date.now()
            })
          });


    }

    sendNewTransaction(){
        return;
    }

    checkAliveNodes(){    
        let currentTime = Date.now();
        for(let uuid in this.aliveNodes){
            if((currentTime - this.aliveNodes[m].lastHeartBeat) > (1000*60*5)){
                this.aliveNodes.delete(uuid)
            }
        }
    }

    updateAliveNode({uuid, external_address, wallet_public}){
        this.aliveNodes.set(uuid,{external_address: external_address, wallet_public: wallet_public, lastHeartBeat: Date.now()})
        console.log(this.aliveNodes);
    }

}


module.exports = PubSub;