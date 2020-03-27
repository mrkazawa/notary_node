const rp = require('request-promise-native');

const pendingRequestURL = 'http://notary1.local:3000/pending_requests';
const pendingTransactionURL = 'http://notary1.local:3000/pending_transactions';
const latestBlockURL = 'http://notary1.local:3000/latest_block';
const blockHeightURL = 'http://notary1.local:3000/block_height';
const txCountPerBlockURL = 'http://notary1.local:3000/tx_count_per_block';
const poolsSizeURL = 'http://notary1.local:3000/pools_size';

function main() {
  let getOption = createGetRequest(pendingRequestURL);
  executeRequest(`Getting Pending Request`, getOption);

  getOption = createGetRequest(pendingTransactionURL);
  executeRequest(`Getting Pending Transaction`, getOption);

  getOption = createGetRequest(latestBlockURL);
  executeRequest(`Getting Latest Block`, getOption);

  getOption = createGetRequest(blockHeightURL);
  executeRequest(`Getting Block Height`, getOption);

  getOption = createGetRequest(txCountPerBlockURL);
  executeRequest(`Getting Tx Count Per Block`, getOption);

  getOption = createGetRequest(poolsSizeURL);
  executeRequest(`Getting Current Pool Sizes`, getOption);
}

function createGetRequest(url) {
  return {
    method: 'GET',
    uri: url,
    resolveWithFullResponse: true,
    json: true, // Automatically stringifies the body to JSON
  };
}

function executeRequest(scenario, options) {
  rp(options).then(function (response) {
    console.log(`--------------------------------------------`);
    console.log(scenario);
    console.log(`--------------------------------------------`);
    console.log('Response status code: ', response.statusCode);
    console.log('Response body: ', response.body);
  }).catch(function (err) {
    console.log(err);
  });
}

main();