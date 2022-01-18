
const Libp2p = require('libp2p');
const PeerId = require('peer-id')
const TCP = require('libp2p-tcp')
const Mplex = require('libp2p-mplex')
const { NOISE } = require('@chainsafe/libp2p-noise')
const Gossipsub = require('libp2p-gossipsub')
const { fromString: uint8ArrayFromString } = require('uint8arrays/from-string')
const { toString: uint8ArrayToString } = require('uint8arrays/to-string')

const Bootstrap = require('libp2p-bootstrap')

P2P_CHANNELS = {
    MESSAGE: "MESSAGE"
}

const bootstrapMultiaddrs = [
    '/ip4/http://RamCoin.xexo.repl.co/tcp/40523/p2p/QmPp1TePtjsKPvGHAVdn8ErELU3GTe3ie6sUgT4Xx8LPG1',
]

class P2PNode {

    constructor(blockchain, transactionPool, wallet){
        this.libp2p = null;
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
    }



   async create(){
       try {


            this.libp2p = await Libp2p.create({
                addresses: {
                listen: ['/ip4/0.0.0.0/tcp/0']
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
                console.log('found peer: ', peerId.toB58String())
            });

            

            await this.libp2p.start();
            console.log(this.libp2p.multiaddrs);
            this.subscribe(); 
       } catch (error) {
        console.error(error)
       }

   }

   async dial({peerId, multiaddrs}){

        console.log(`Adding new peer ${peerId} @ ${multiaddrs}`)
        this.libp2p.peerStore.addressBook.set(peerId, multiaddrs);
        await this.libp2p.dial(peerId);
   }

   subscribe(){
       this.libp2p.pubsub.subscribe(P2P_CHANNELS.MESSAGE);
       console.log(`P2P Node subscribed to ${P2P_CHANNELS.MESSAGE}`)
       this.libp2p.pubsub.on(P2P_CHANNELS.MESSAGE, (message) => {
           this.recieveMessage(message.data);
       })
   }

   sendMessage(message_data){
       this.libp2p.pubsub.publish(P2P_CHANNELS.MESSAGE, uint8ArrayFromString(message_data));
   }

   recieveMessage(message_data){
       console.log(`Received Message: ${uint8ArrayToString(message_data)}`);
   }

}

module.exports = P2PNode;