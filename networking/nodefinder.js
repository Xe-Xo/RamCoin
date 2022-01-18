const PubNub = require('pubnub');
const uuid = require('uuid');

const credentials = {
  publishKey: 'pub-c-ec30f7ec-578f-4aa2-81c8-59077fb942c4',
  subscribeKey: 'sub-c-eda4e664-027b-11e9-a39c-e60c31199fb2',
  secretKey: 'sec-c-OWQwMTg1MGMtY2U2YS00ZmVlLWE1YmEtOTVmMWZmN2ZiOWVm',
  uuid: uuid()
};

const CHANNELS = {
  NODE_HEARTBEAT: 'NODE_HEARTBEAT'
};

class NodeFinder {
  constructor({p2pNode}) {
    this.p2pNode = p2pNode;
    this.pubnub = new PubNub(credentials);
    this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
    this.pubnub.addListener(this.listener());
    console.log(this.p2pNode);
    this.broadcastAddress();
  }

  broadcastAddress() {
    this.publish({
      channel: CHANNELS.NODE_HEARTBEAT,
      message: JSON.stringify({peerId: this.p2pNode.libp2p.peerId, multiaddress: this.p2pNode.libp2p.multiaddress})
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

        console.log(`Message received. Channel: ${channel}. Message: ${message}`);
        const parsedMessage = JSON.parse(message);

        switch(channel) {
          case CHANNELS.NODE_HEARTBEAT:
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
