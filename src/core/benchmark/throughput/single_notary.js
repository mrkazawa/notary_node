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

const instance = autocannon({
  title: 'Send Request To Notary #1',
  url: 'http://notary1.local:3000/transact',
  method: 'POST',
  headers: {
    "content-type": "application/json"
  },
  body: JSON.stringify(payload_400_bytes),
  connections: 10, // concurrent connection
  pipelining: 1, // default
  bailout: 50, // tolerable number of errors
  //overallRate: 2000, // rate of requests to make per second from all connections
  amount: 15000000, // ITU-T suggests 15,000,000 IoT requests per day
  duration: 1
}, console.log);

// this is used to kill the instance on CTRL-C
process.once('SIGINT', () => {
  instance.stop();
});

// just render results
autocannon.track(instance, {
  renderProgressBar: true,
  renderResultsTable: false,
  renderLatencyTable: false
});

instance.on('tick', (counter) => {
  console.log(counter); // {counter, bytes}
});

instance.on('done', (results) => {
  console.log(`Avg Tput (Req/sec): ${results.requests.average}`);
  console.log(`Avg Lat (ms): ${results.latency.average}`);
});