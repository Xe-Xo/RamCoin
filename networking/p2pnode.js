
const Libp2p = require('libp2p');

const {HUMAN_NAME} = require('./credentials');

const TCP = require('libp2p-tcp')
const Mplex = require('libp2p-mplex')
const { NOISE } = require('@chainsafe/libp2p-noise')
const Gossipsub = require('libp2p-gossipsub')
const { fromString: uint8ArrayFromString } = require('uint8arrays/from-string')
const { toString: uint8ArrayToString } = require('uint8arrays/to-string')

const Bootstrap = require('libp2p-bootstrap')

P2P_CHANNELS = {
    MESSAGE: "MESSAGE",
    BLOCKCHAIN: "BLOCKCHAIN",
    TRANSACTION: "TRANSACTION"
}

const bootstrapMultiaddrs = [

]

class P2PNode {

    constructor(blockchain, transactionPool, wallet){
        this.libp2p = null;
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.human_name = HUMAN_NAME;
    }

    // NETWORKING

    async create(){
        try {
                this.libp2p = await Libp2p.create({
                    addresses: {
                    listen: ['/ip4/0.0.0.0/tcp/5000']
                    },
                    modules: {
                    transport: [TCP],
                    streamMuxer: [Mplex],
                    connEncryption: [NOISE],
                    pubsub: Gossipsub,
                    },
                    config: {
                        peerDiscovery: {
                            [Bootstrap.tag]: {
                                list: bootstrapMultiaddrs
                            }
                        }
                    }
            
                });

                this.libp2p.on('peer:discovery', function (peerId) {
                    console.log('found peer: ', peerId.toHexString())
                });

                try {
                    await this.libp2p.start();
                } catch (error) {
                    log('libp2p didnt start')
                }
                this.subscribe(); 

        } catch (error) {
            console.error(error)
        }

    }

    async dial({peerId, multiaddrs}){

            console.log(`Adding new peer ${peerId} @ ${multiaddrs}`)

            if (this.libp2p.peerId.toB58String() === peerId.toB58String()) {
                console.log(`My own libp2p`)
            } else {

                try {
                    this.libp2p.peerStore.addressBook.set(peerId, multiaddrs);
                } catch (error) {
                    console.error('couldnt set address')
                    console.error(error);
                }

                try {
                    await this.libp2p.dial(peerId);
                } catch (error) {
                    await this.libp2p.hangUp(peerId);
                    console.error(`couldnt dial @ ${peerId} ${multiaddrs} `)
                }
            }
            
    }

    subscribe(){

        let p2p_channels = Object.values(P2P_CHANNELS);
            p2p_channels.forEach(channel => {
                this.libp2p.pubsub.subscribe(channel);
                console.log(`P2P Node subscribed to ${channel}`)
                this.libp2p.pubsub.on(channel, (message) => {
                    this.recieveMessage(channel,message.data);
                });    
            });

    

        
    }

   // SENDING MESSAGES

    sendMessage(channel,message){
        console.log(`${channel} Sending Message ${message}`)
        this.libp2p.pubsub.publish(P2P_CHANNELS.MESSAGE, uint8ArrayFromString(message));
    }

    recieveMessage(channel,message_data){
        console.log(`${channel} Received Message: ${uint8ArrayToString(message_data)}`);

        const parsedMessage = JSON.parse(message);

        switch (channel) {
            case P2P_CHANNELS.MESSAGE:
                break;
        
            case P2P_CHANNELS.BLOCKCHAIN:
                this.blockchain.replaceChain(parsedMessage, true, () => {
                    this.transactionPool.clearBlockchainTransactions({chain: parsedMessage});
                })
                break;

            case P2P_CHANNELS.TRANSACTION:
                if (!this.transactionPool.existingTransaction({
                    inputAddress: this.wallet.publicKey
                    })) {
                    console.log(`Recieved New Transaction - ${Object.values(parsedMessage.outputMap)}`)
                    this.transactionPool.setTransaction(parsedMessage);
                }

                break;

            default:
                break;
        }
    }

    // BLOCKCHAIN

    broadcastTransaction(transaction){
        console.log(`Publishing New Transaction ${JSON.stringify(transaction)}`);
        this.sendMessage(P2P_CHANNELS.TRANSACTION, JSON.stringify(transaction));
    }

    broadcastChain(){
        console.log(`Publishing New Chain ${this.blockchain.chain.length}`);
        this.sendMessage(P2P_CHANNELS.BLOCKCHAIN, JSON.stringify(this.blockchain.chain));
    }

    recieveTransaction(transaction){

    }

    recieveChain(chain){

    }




}

module.exports = P2PNode;