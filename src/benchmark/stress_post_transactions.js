'use strict'

const autocannon = require('autocannon');

const payload = {
    data: "this is a dummy transaction data"
}

const instance = autocannon({
  url: 'http://notary1.local:3000/transact',
  method: 'POST',
  headers: {
    "content-type": "application/json"
  },
  body: JSON.stringify(payload),
  connections: 1,
  pipelining: 1, // default
  duration: 600
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