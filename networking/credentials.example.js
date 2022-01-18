const PubNub = require('pubnub');
const uuid = PubNub.generateUUID();

module.exports = credentials = {
    publishKey: 'pub-c-xxxxxxx',
    subscribeKey: 'sub-c-xxxxxxxx',
    uuid: uuid
  };