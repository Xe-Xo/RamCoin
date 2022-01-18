const PubNub = require('pubnub');


const credentials = require('./credentials');

const CHANNELS = {
  NODE_HEARTBEAT: 'NODE_HEARTBEAT'
};

class NodeFinder {
  constructor({p2pNode}) {
    this.p2pNode = p2pNode;
    this.pubnub = new PubNub(credentials);
    this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
    this.pubnub.addListener(this.listener());
    this.getExternal().then((externalip) => {this.broadcastAddress(externalip)})
  }

  async getExternal(){
    var http = require('http');

    http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function(resp) {
      resp.on('data', function(ip) {
        console.log("My public IP address is: " + ip);
        return ip;
      });
    });

    
  }

  broadcastAddress(externalip) {
    this.publish({
      channel: CHANNELS.NODE_HEARTBEAT,
      message: JSON.stringify({peerId: this.p2pNode.libp2p.peerId, multiaddrs: this.p2pNode.libp2p.multiaddrs, externalip: externalip})
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
            console.log(`Message received. Channel: ${channel}. Message: ${parsedMessage.multiaddrs}`);
            this.pubsub.dial({peerId: parsedMessage.peerId, multiaddress: parsedMessage.multiaddrs})
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
