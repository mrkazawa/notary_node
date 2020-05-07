const fs = require('fs');
const axios = require('axios').default;
const http = require('http');

/**
 * Clear (make it empty) the given file in the path.
 * 
 * @param {string} path   The path to the file
 */
const clearFIle = function (path) {
  fs.writeFileSync(path, "");
};

/**
 * Write given object to json file.
 * 
 * @param {string} path   The path to the JSON file
 * @param {object} json   The object to be stored in json
 */
const writeJsonFile = function (path, json) {
  fs.writeFileSync(path, json, {
    encoding: 'utf8',
    flag: 'w'
  });
};

/**
 * Get JSON file from given path.
 * 
 * @param {string} path     The path to the JSON file
 */
const readJsonFIle = function (path) {
  if (fs.existsSync(path)) {
    const rawdata = fs.readFileSync(path);
    return JSON.parse(rawdata);
  } else {
    return new Error(`${path} does not exist`);
  }
};

/**
 * Record the difference between start and end of the performance.now().
 * Then, save the result in the given path.
 * 
 * @param {string} scenario   The scenario description of this mesarument
 * @param {string} path       The path to the file
 * @param {number} start      The start point of performance.now()
 * @param {number} end        The end point of performance.now()
 */
const savingResult = function (scenario, path, start, end) {
  const delta = end - start;
  const row = scenario + "," +
    delta + "," +
    "\r\n";
  fs.appendFileSync(path, row);
};

/**
 * Form an axios GET request option object.
 * Run this method in conjuction with the sendRequest method.
 * 
 * @param {string} url    The string url of request
 */
const formGetRequest = function (url) {
  return {
    method: 'get',
    url: url,
    httpAgent: new http.Agent({
      keepAlive: false
    })
  };
};

/**
 * Form an axios POST request option object.
 * Run this method in conjuction with the sendRequest method.
 * 
 * @param {string} url        The string url of request
 * @param {object} payload    The json object of request body
 */
const formPostRequest = function (url, payload) {
  return {
    method: 'post',
    url: url,
    data: payload,
    httpAgent: new http.Agent({
      keepAlive: false
    })
  };
};

/**
 * Send HTTP request using axios module.
 * 
 * @param {object} options    The object containing parameters for the request
 */
const sendRequest = async function (options) {
  try {
    return await axios(options);
  } catch (err) {
    return new Error(`Error sending request ${err}`);
  }
};

/**
 * Parse core engine block object to get the application data.
 * It goes deep to the object and extract only data related to this
 * application by comparing the APP ID.
 * It returns array of object for this application.
 * 
 * @param {object} block  The block from Core Engine
 * @param {number} appId  The application identifier
 */
const getAppRequestsFromBlock = function (block, appId) {
  let appRequests = [];
  const txs = block.data;

  for (let j = 0; j < txs.length; j++) {
    const tx = txs[j][1];
    const requests = tx.input.data;

    for (let k = 0; k < requests.length; k++) {
      let request = requests[k][1];

      if (request.app_id == appId) {
        appRequests.push(request);
      }
    }
  }

  return appRequests;
};

module.exports = {
  clearFIle,
  writeJsonFile,
  readJsonFIle,
  savingResult,
  formGetRequest,
  formPostRequest,
  sendRequest,
  getAppRequestsFromBlock
};