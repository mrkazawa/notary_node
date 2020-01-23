'use strict'

const autocannon = require('autocannon');
const { performance } = require('perf_hooks');
const EventEmitter = require('events');
const uuid = require("uuid");

const payload_350_bytes = {
    data: {
        app_id: "car_rental_2020",
        task_id: 45637,
        process_id: 50340,
        storage_address: "QmWWQSuPMS6aXCbZKpEjPHPUZN2NjB3YrhJTHsV4X3vb2t",
        compute_address: "0x0472ec0185ebb8202f3d4ddb0226998889663cf2",
        compute_network_id: 2020,
        payment_proof: "MYPAYMENTPROOF99999999999999999999999999999999999999999999999999999999"
    }
}

const payload_in_string = JSON.stringify(payload_350_bytes).replace(/"/g, '\'');

const instance = autocannon({
    url: 'http://10.0.0.12:3000/transactions',
    method: 'POST',
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload_350_bytes),
    connections: 1, // concurrent connection
    pipelining: 1, // default
    bailout: 20, // tolerable number of errors
    //overallRate: 200, // rate of requests to make per second from all connections
    duration: 10
}, console.log)

// this is used to kill the instance on CTRL-C
process.once('SIGINT', () => {
    instance.stop()
})

// just render results
autocannon.track(instance, {
    renderProgressBar: true,
    renderResultsTable: true,
    renderLatencyTable: false
})
