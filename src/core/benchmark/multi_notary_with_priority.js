'use strict'

const autocannon = require('autocannon');

const notaryOneURL = `http://notary1.local:3000/transact`;
const notaryTwoURL = `http://notary2.local:3000/transact`;
const notaryThreeURL = `http://notary3.local:3000/transact`;
const notaryFourURL = `http://notary4.local:3000/transact`;

let instances = [];

instances.push(constructAutoCannonInstance('Notary #1 Priority #1', notaryOneURL, 1));
instances.push(constructAutoCannonInstance('Notary #1 Priority #2', notaryOneURL, 2));
instances.push(constructAutoCannonInstance('Notary #1 Priority #3', notaryOneURL, 3));

instances.push(constructAutoCannonInstance('Notary #2 Priority #1', notaryTwoURL, 1));
instances.push(constructAutoCannonInstance('Notary #2 Priority #2', notaryTwoURL, 2));
instances.push(constructAutoCannonInstance('Notary #2 Priority #3', notaryTwoURL, 3));

instances.push(constructAutoCannonInstance('Notary #3 Priority #1', notaryThreeURL, 1));
instances.push(constructAutoCannonInstance('Notary #3 Priority #2', notaryThreeURL, 2));
instances.push(constructAutoCannonInstance('Notary #3 Priority #3', notaryThreeURL, 3));

instances.push(constructAutoCannonInstance('Notary #4 Priority #1', notaryFourURL, 1));
instances.push(constructAutoCannonInstance('Notary #4 Priority #2', notaryFourURL, 2));
instances.push(constructAutoCannonInstance('Notary #4 Priority #3', notaryFourURL, 3));

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

function constructPayload(priority_id) {
  return {
    app_id: "car_rental_2020",
    task_id: 45637,
    process_id: 50340,
    storage_address: "QmWWQSuPMS6aXCbZKpEjPHPUZN2NjB3YrhJTHsV4X3vb2t",
    compute_address: "0x0472ec0185ebb8202f3d4ddb0226998889663cf2",
    compute_network_id: 2020,
    payment_proof: "MYPAYMENTPROOF99999999999999999999999999999999999999999999999999999999",
    priority_id: priority_id,
    timestamp: Date.now()
  }
}

function constructAutoCannonInstance(title, url, priority_id) {
  return autocannon({
    title: title,
    url: url,
    method: 'POST',
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify( {data:constructPayload(priority_id)} ),
    connections: 10, // ITU-T suggests using 10 gateways (concurent connection)
    pipelining: 1, // default
    bailout: 50, // tolerable number of errors
    overallRate: 500, // rate of requests to make per second from all connections (set to 500)
    amount: 1250000, // ITU-T suggests 15,000,000 IoT requests per day (divided by 4, then divided by 3)
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