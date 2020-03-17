const rp = require('request-promise-native');

function main() {
  const getUrl = 'http://notary1.local:3000/block_pool_size';
  const getOption = createGetRequest(getUrl);
  executeRequest(getOption);

  const clearUrl = 'http://notary1.local:3000/clear_block_pool';
  const clearOption = createGetRequest(clearUrl);
  executeRequest(clearOption);

  executeRequest(getOption);
}

function createGetRequest(url) {
  return {
    method: 'GET',
    uri: url,
    resolveWithFullResponse: true,
    json: true, // Automatically stringifies the body to JSON
  };
}

function executeRequest(options) {
  rp(options).then(function (response) {
    console.log('Response status code: ', response.statusCode)
    console.log('Response body: ', response.body);
  }).catch(function (err) {
    console.log(err);
  });
}

main();