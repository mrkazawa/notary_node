'use strict'

const autocannon = require('autocannon');

const payload_400_bytes = {
  data: {
    app_id: "car_rental_2020",
    task_id: 45637,
    process_id: 50340,
    storage_address: "QmWWQSuPMS6aXCbZKpEjPHPUZN2NjB3YrhJTHsV4X3vb2t",
    compute_address: "0x0472ec0185ebb8202f3d4ddb0226998889663cf2",
    compute_network_id: 2020,
    payment_proof: "MYPAYMENTPROOF99999999999999999999999999999999999999999999999999999999",
    priority_id: 3,
    timestamp: Date.now()
  }
};

const notaryOneURL = `http://notary1.local:3000/transact`;
const notaryTwoURL = `http://notary2.local:3000/transact`;
const notaryThreeURL = `http://notary3.local:3000/transact`;
const notaryFourURL = `http://notary4.local:3000/transact`;

let instances = [];

instances.push(constructAutoCannonInstance('Send Request To Notary #1', notaryOneURL));
instances.push(constructAutoCannonInstance('Send Request To Notary #2', notaryTwoURL));
instances.push(constructAutoCannonInstance('Send Request To Notary #3', notaryThreeURL));
instances.push(constructAutoCannonInstance('Send Request To Notary #4', notaryFourURL));

// run benchmark
instances.forEach(function(instance){
  runAutoCannon(instance);
  //registerTickEvent(instance);
  registerDoneEvent(instance);
});

// this is used to kill the instance on CTRL-C
process.once('SIGINT', () => {
  instances.forEach(function(instance){
    instance.stop();
  });
});

function constructAutoCannonInstance(title, url) {
  return autocannon({
    title: title,
    url: url,
    method: 'POST',
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload_400_bytes),
    connections: 10, // ITU-T suggests using 10 gateways (concurent connection)
    pipelining: 1, // default
    bailout: 50, // tolerable number of errors
    overallRate: 1500, // rate of requests to make per second from all connections
    amount: 3750000, // ITU-T suggests 15,000,000 IoT requests per day (divided by 4)
    duration: 1
  }, console.log);
}

function runAutoCannon(instance) {
  autocannon.track(instance, {
    renderProgressBar: true,
    renderResultsTable: false,
    renderLatencyTable: false
  });
}

function registerDoneEvent(instance) {
  instance.on('done', (results) => {
    console.log(`${instance.opts.title} Results:`);
    console.log(`Avg Tput (Req/sec): ${results.requests.average}`);
    console.log(`Avg Lat (ms): ${results.latency.average}`);
  });
}

function registerTickEvent(instance) {
  instance.on('tick', (counter) => {
    console.log(`${instance.opts.title} Counter: ${counter.counter}`); // {counter, bytes}
  });
}