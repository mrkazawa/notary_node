const rp = require('request-promise-native');

function main() {
  const addTransactionUrl = 'http://notary1.local:3000/transact';

  let option = createPostRequest(addTransactionUrl, createPayload());
  executeRequest('Sending New Transaction', option);
}

function createPayload() {
  return {
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
}

function createPostRequest(url, body) {
  return {
    method: 'POST',
    uri: url,
    body: body,
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