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
    url: '10.0.0.11:26657/broadcast_tx_commit?tx="' + uuid.v4() + '=' + payload_in_string + '"',
    method: 'GET',
    connections: 1, // concurrent connection
    pipelining: 1, // default
    bailout: 20, // tolerable number of errors
    overallRate: 10, // rate of requests to make per second from all connections
    duration: 10,
    setupClient: setupClient
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

instance.on('done', handleResults)
instance.on('tick', () => console.log('ticking'))
instance.on('response', handleResponse)

function setupClient(client) {
    client.on('body', handleResponseInClient)
}

function handleResponseInClient(resBuffer) {
    //console.log(resBuffer.toString());
}

function handleResponse(client, statusCode, resBytes, responseTime) {
    //console.log(`Got response with code ${statusCode} in ${responseTime} milliseconds`)
    //console.log(`response: ${resBytes.toString()}`)
    const request = {
        url: '10.0.0.11:26657/broadcast_tx_commit?tx="' + uuid.v4() + '=' + payload_in_string + '"',
        method: 'GET'
    };
    client.setRequest(request);
}

function handleResults(result) {
    // ...
}
