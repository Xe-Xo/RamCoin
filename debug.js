const {NodeFinder, PUBNUB_CHANNELS} = require('./networking/nodefinder');

const node_finder = new NodeFinder({p2pNode: null});

node_finder.publish({ channel: "CHANNEL", message: "MESSAGE_TEST1"})