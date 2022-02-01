const PubNub = require('pubnub');

const { v4: uuidv4 } = require('uuid')

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
        this.pubnub.addListener(this.listener());

    }

    listener(){
        return {
            message: messageObject => {
              const { channel, message } = messageObject;
              console.log(`Message received. Channel: ${channel}. Message: ${message}`);
              const parsedMessage = JSON.parse(message);

              switch(channel) {
                case PUBNUB_CHANNELS.NODE_HEARTBEAT:                 
                  break;
                case PUBNUB_CHANNELS.TEST:
                  break
                case PUBNUB_CHANNELS.NEW_BLOCK:                 
                  break;
                case PUBNUB_CHANNELS.NEW_TRANSACTION:
                  break      
      
                default:
                  return;
              }
            }
          }
    }

    onNodeHeartBeat(message){
        if (uuid === this.uuid) {
            return; //Dont do anything on our own heartbeat
        }

        this.updateAliveNode({uuid: message.uuid, external_address: message.external_address, wallet_public: message.wallet_public})
    }

    async sendNodeHeartBeat(){

        const external_json = await fetch('https://httpbin.org/ip').then(response => response.json());
        console.log(`My external IP is ${external_json.origin}`)

        const result = await this.pubnub.publish({
            channel: PUBNUB_CHANNELS.NODE_HEARTBEAT,
            message: JSON.stringify({
                uuid: this.uuid,
                wallet_public: this.wallet.publicKey,
                block_length: this.blockchain.chain.length,
                external_address: external_json.origin,
                time_sent: Date.now()
            })
          });

        return result;
    }

    onNewBlock(message){
        return;
    }

    onNewTransaction(message){
        return;
    }

    async sendNewBlock(){
        return;
    }

    async sendNewTransaction(){
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
        if (uuid !== this.uuid) {
            this.aliveNodes.set(uuid,{external_address: external_address, wallet_public: wallet_public, lastHeartBeat: Date.now()})
        }
    }

}


module.exports = PubSub;