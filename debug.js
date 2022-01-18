const {NodeFinder, PUBNUB_CHANNELS} = require('./networking/nodefinder');
const credentials = require('./networking/credentials');

const P2PNode = require('./networking/p2pnode');


const p2pserver = new P2PNode(null, null, null);

p2pserver.create().then(() => {
    nodefinder = new NodeFinder({p2pNode: p2pserver});
    setInterval(function() {
        nodefinder.publish({ channel: "TEST", message: "home"});
    },60000);
})


