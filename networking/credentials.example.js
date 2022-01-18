const PubNub = require('pubnub');
const uuid = PubNub.generateUUID();

const credentials = {
    publishKey: 'pub-c-xx',
    subscribeKey: 'sub-c-xx',
    uuid: uuid
  };

const HUMAN_NAME = "HUMAN_NAME"

module.exports = {credentials, HUMAN_NAME}