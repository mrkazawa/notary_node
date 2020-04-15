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

let instanceOne = constructAutoCannonInstance('Single Notary #4', notaryFourURL, 10, 100);
let instanceTwo;
let instanceThree;
startAutoCannon(instanceOne);

instanceOne.on('tick', (counter) => {
  recordRequestCounter(counter);
});

instanceOne.on('done', (results) => {
  instanceTwo = constructAutoCannonInstance('Single Notary #4', notaryFourURL, 2, 20);
  startAutoCannon(instanceTwo);

  instanceTwo.on('tick', (counter) => {
    recordRequestCounter(counter);
  });
  
  instanceTwo.on('done', (results) => {
    instanceThree = constructAutoCannonInstance('Single Notary #4', notaryFourURL, 2000, 20000);
    startAutoCannon(instanceThree);

    instanceThree.on('tick', (counter) => {
      recordRequestCounter(counter);
    });
    
    instanceThree.on('done', (results) => {
      const option = createGetRequestOption(txCountPerBlockURL);
      setTimeout(function () {
        executeRequest(option);
      }, 5000);
    });
  });
});

// this is used to kill the instance on CTRL-C
process.on('SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );

  instanceOne.stop();
  instanceTwo.stop();
  instanceThree.stop();
});

/**
 * Record and save the number of generated requests of Autocannon
 * Call this function during 'tick' event.
 * 
 * @param {object} counter  The Autocannon counter object
 */
function recordRequestCounter(counter) {
  if (counter.counter == 0) {
    log(chalk.redBright(`WARN! requests possibly is not being processed`));

  } else {
    const row = counter.counter + "\r\n";
    fs.appendFileSync(RESULT_PATH, row);
  }
}

/**
 * Run and track the given Autocannon instance
 * 
 * @param {object} instance   Autocannon instance to start
 */
function startAutoCannon(instance) {
  autocannon.track(instance, {
    renderProgressBar: true,
    renderResultsTable: false,
    renderLatencyTable: false,
    progressBarString: `Running :percent | Elapsed :elapsed (seconds) | Rate :rate | ETA :eta (seconds)`
  });
}

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
 * 
 * @param {string} title        The string title of this instance
 * @param {string} url          The string target URL for this instance
 * @param {number} overallRate  The rate of requests per second from all connections
 * @param {number} duration     The duration of the requests
 */
function constructAutoCannonInstance(title, url, overallRate, amount) {
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
    connections: 1,
    pipelining: 1, // default
    bailout: 1000, // tolerable number of errors
    overallRate: overallRate,
    amount: amount,
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