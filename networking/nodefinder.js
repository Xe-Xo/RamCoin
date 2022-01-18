const PubNub = require('pubnub');
const { Multiaddr } = require('multiaddr')
const http = require('http');
const fetch = require('node-fetch');

const credentials = require('./credentials');
const { response } = require('express');


const CHANNELS = {
  NODE_HEARTBEAT: 'NODE_HEARTBEAT'
};

class NodeFinder {
  constructor({p2pNode}) {
    this.p2pNode = p2pNode;
    this.pubnub = new PubNub(credentials);
    this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
    this.pubnub.addListener(this.listener());
    this.external_address = '';
  }


  async broadcastAddress() {

    const external_json = await fetch('https://httpbin.org/ip').then(response => response.json());
    console.log(`My external IP is ${external_json.origin}`)

    this.publish({
      channel: CHANNELS.NODE_HEARTBEAT,
      message: JSON.stringify({peerId: this.p2pNode.libp2p.peerId, multiaddrs: this.p2pNode.libp2p.multiaddrs, external_address: external_json.origin})
    });

  }

  subscribeToChannels() {
    this.pubnub.subscribe({
      channels: [Object.values(CHANNELS)]
    });
  }

  listener() {
    return {
      message: messageObject => {
        const { channel, message } = messageObject;

        //console.log(`Message received. Channel: ${channel}. Message: ${message}`);
        const parsedMessage = JSON.parse(message);

        switch(channel) {
          case CHANNELS.NODE_HEARTBEAT:
            console.log(`Message received. Channel: ${channel}. Message: ${parsedMessage}`);
            console.log(`External address provided is ${parsedMessage.external_address}`);       
            this.pubsub.dial({peerId: parsedMessage.peerId, multiaddress: parsedMessage.multiaddress})
            
            break;
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

module.exports = NodeFinder;
