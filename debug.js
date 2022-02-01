const credentials = require('./networking/credentials');

const PubSub = require('./networking/pubsub');


const pubsub = new PubSub(null, null, null);

setInterval(async function() {
    const result = await pubsub.pubnub.publish({ channel: "TEST", message: "home"});
    console.log(pubsub.aliveNodes)
    console.log(result)
},15000);



