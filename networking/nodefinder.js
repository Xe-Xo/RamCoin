const PubNub = require('pubnub');
const { Multiaddr } = require('multiaddr')
const PeerId = require('peer-id')

const http = require('http');
const fetch = require('node-fetch');

const credentials = require('./credentials');


const PUBNUB_CHANNELS = {
  TEST: 'TEST',
  BROADCAST_ADDRESS: 'BROADCAST_ADDRESS'
};

class NodeFinder {
  constructor({p2pNode}) {
    this.p2pNode = p2pNode;
    this.pubnub = new PubNub(credentials);
    this.pubnub.subscribe({ channels: Object.values(PUBNUB_CHANNELS) });
    this.pubnub.addListener(this.listener());
  }




  async broadcastAddress() {

    const external_json = await fetch('https://httpbin.org/ip').then(response => response.json());
    console.log(`My external IP is ${external_json.origin}`)

    const result = await this.pubnub.publish({
      channel: PUBNUB_CHANNELS.BROADCAST_ADDRESS,
      message: JSON.stringify({peerId: this.p2pNode.libp2p.peerId, multiaddrs: this.p2pNode.libp2p.multiaddrs, external_address: external_json.origin})
    });

  }

  subscribeToChannels() {
    this.pubnub.subscribe({
      channels: [Object.values(PUBNUB_CHANNELS)]
    });
  }

  listener() {
    return {
      message: messageObject => {
        const { channel, message } = messageObject;

        console.log(`Message received. Channel: ${channel}. Message: ${message}`);
        const parsedMessage = JSON.parse(message);

        switch(channel) {
          case PUBNUB_CHANNELS.BROADCAST_ADDRESS:
            console.log(`Message received. Channel: ${channel}. Message: ${parsedMessage}`);
            console.log(`External address provided is ${parsedMessage.external_address}`);
            console.log(`PeerId ${parsedMessage.peerId.id}`);
            console.log(`Multiaddrs ${parsedMessage.multiaddrs}`); 
            const multiaddrs = [];

            for (let index = 0; index < parsedMessage.multiaddrs.length; index++) {
              const multiaddr = parsedMessage.multiaddrs[index];
              const multiaddr_split = multiaddr.split('/');
              const newmultiaddr = Multiaddr.fromNodeAddress({address: parsedMessage.external_address, port: multiaddr_split[4], family: 4}, multiaddr_split[3]);
              multiaddrs.push(newmultiaddr);
            }


            console.log(multiaddrs);           
            PeerId.createFromJSON(parsedMessage.peerId).then((peerId) => {
              this.p2pNode.dial({peerId: peerId, multiaddrs: multiaddrs})
            })      
            break;
          case PUBNUB_CHANNELS.TEST:
            console.log("Received Test");


          default:
            return;
        }
      }
    }
  }

  publish({ channel, message }) {
    // there is an unsubscribe function in pubnub
    // but it doesn't have a callback that fires after success
    // therefore, redundant publishes to the same local subscriber will be accepted as noisy no-ops
    this.pubnub.publish({ message, channel });
  }




}

module.exports = {NodeFinder, PUBNUB_CHANNELS};
