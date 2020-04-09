'use strict'

const autocannon = require('autocannon');
const rp = require('request-promise-native');
const fs = require('fs');
const chalk = require('chalk');
const log = console.log;

const RESULT_PATH = '/home/yustus/result_autocannon.csv';
const COUNT_PATH = '/home/yustus/result_block_count.json';
fs.writeFileSync(RESULT_PATH, '');
fs.writeFileSync(COUNT_PATH, '');

const notaryFourURL = `http://notary4.local:3000/transact`;
const txCountPerBlockURL = 'http://notary1.local:3000/tx_count_per_block';

let instance = constructAutoCannonInstance('Single Notary #4', notaryFourURL);

autocannon.track(instance, {
  renderProgressBar: true,
  renderResultsTable: false,
  renderLatencyTable: false,
  progressBarString: `Running :percent | Elapsed :elapsed (seconds) | Rate :rate | ETA :eta (seconds)`
});

instance.on('tick', (counter) => {
  if (counter.counter == 0) {
    log(chalk.redBright(`${instance.opts.title} WARN! requests possibly is not being processed`));
  }
});

instance.on('done', (results) => {
  log(chalk.cyan(`${instance.opts.title} Results:`));
  log(chalk.cyan(`Avg Tput (Req/sec): ${results.requests.average}`));
  log(chalk.cyan(`Avg Lat (ms): ${results.latency.average}`));

  const row = instance.opts.title + "," + results.requests.average + "," + results.latency.average + "\r\n";
  fs.appendFileSync(RESULT_PATH, row);
  log(chalk.cyan(`AutoCannon throughput result is saved at ${RESULT_PATH}`));

  const option = createGetRequestOption(txCountPerBlockURL);
  executeRequest(option);
});

// this is used to kill the instance on CTRL-C
process.on('SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );

  instance.stop();
});

/**
 * Construct a fake IoT application requests for the Core Engine.
 * This object size is about 400 bytes.
 */
function constructPayload() {
  return {
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
}

/**
 * Construct an AutoCannon instance.
 * Play around with the 'amount' and 'overallRate' values.
 * 
 * @param {string} title  The string title of this instance
 * @param {string} url    The string target URL for this instance
 */
function constructAutoCannonInstance(title, url) {
  return autocannon({
    title: title,
    url: url,
    method: 'POST',
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      data: constructPayload()
    }),
    connections: 10, // ITU-T suggests using 10 gateways (concurent connection)
    pipelining: 1, // default
    bailout: 500, // tolerable number of errors
    //overallRate: 6000, // rate of requests to make per second from all connections
    amount: 1500000, // ITU-T suggests 15,000,000 IoT requests per day
    duration: 1
  }, console.log);
}

/**
 * Create a GET request option for Request module.
 * 
 * @param {string} url  The string of target URL
 */
function createGetRequestOption(url) {
  return {
    method: 'GET',
    uri: url,
    resolveWithFullResponse: true,
    json: true, // Automatically stringifies the body to JSON
  };
}

/**
 * Run the Request module and execute the HTTP request.
 * 
 * @param {object} options    The object parameters for the Request module
 */
function executeRequest(options) {
  rp(options).then(function (response) {
    if (response.statusCode == 200) {
      fs.writeFileSync(COUNT_PATH, JSON.stringify(response.body));
      log(chalk.cyan(`Block count is saved at ${COUNT_PATH}`));
    } else {
      log(chalk.red(`Server return error code of ${response.statusCode}`));
    }

  }).catch(function (err) {
    log(chalk.red(`Error getting block count! ${err}`));
  });
}