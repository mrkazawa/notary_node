const fs = require('fs');
const axios = require('axios').default;

var tools = {
  /**
   * Clear (make it empty) the given file in the path.
   * 
   * @param {string} path   The path to the file
   */
  clearFIle: function (path) {
    fs.writeFileSync(path, "");
  },

  /**
   * Write given object to json file.
   * 
   * @param {string} path   The path to the JSON file
   * @param {object} json   The object to be stored in json
   */
  writeJsonFile: function (path, json) {
    fs.writeFileSync(path, json, {
      encoding: 'utf8',
      flag: 'w'
    });
  },

  /**
   * Get JSON file from given path.
   * 
   * @param {string} path     The path to the JSON file
   */
  readJsonFIle: function (path) {
    if (fs.existsSync(path)) {
      const rawdata = fs.readFileSync(path);
      return JSON.parse(rawdata);
    } else {
      return new Error(`${path} does not exist`);
    }
  },

  /**
   * Record the difference between start and end of the performance.now().
   * Then, save the result in the given path.
   * 
   * @param {string} scenario   The scenario description of this mesarument
   * @param {string} path       The path to the file
   * @param {number} start      The start point of performance.now()
   * @param {number} end        The end point of performance.now()
   */
  savingResult: function (scenario, path, start, end) {
    const delta = end - start;
    const row = scenario + "," +
      delta + "," +
      "\r\n";
    fs.appendFileSync(path, row);
  },

  /**
   * Send HTTP request using axios module.
   * 
   * @param {object} options    The object containing parameters for the request
   */
  sendRequest: async function (options) {
    try {
      return await axios(options);
    } catch (err) {
      return new Error(`Error sending request ${err}`);
    }
  },

  /**
   * Print the given error to console and exit the program.
   * 
   * @param {object} error    The error object
   */
  logAndExit: function (error) {
    console.log(error);
    process.exit(69);
  }
}

module.exports = tools;