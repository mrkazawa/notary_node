const {
  performance
} = require('perf_hooks');

const carProcessor = require('./car');
const tools = require('../tools');

const {
  APP_ID,
  TASK_ID
} = require('../config');

/**
 * Processing appliation notifications that is sent by the Core Engine.
 * The body of the request will contain the recently included block
 * in the Core Engine.
 * 
 * @param {object} req    The request object from Express
 * @param {object} res    The response object from Express
 */
const processCoreEvent = function (req, res) {
  // TODO: need to make sure that outsiders cannot send this request.
  // It only be done from localhost only.
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(`The IP is ${ip}`);

  console.log('Getting notification from Core Engine..');
  const start = performance.now();

  const block = req.body;
  const appRequests = tools.getAppRequestsFromBlock(block, APP_ID);

  if (appRequests.length > 0) {

    for (let appRequest of appRequests) {
      const taskId = appRequest.task_id;
      console.log(`Processing TASK ID of ${taskId}..`);

      if (taskId == TASK_ID.INSERT_NEW_CAR) {
        carProcessor.insertNewCar(appRequest, start);

      } else if (taskId == TASK_ID.AUTHORIZE_CAR) {
        carProcessor.authorizeCar(appRequest, start);

      }
    }
  }

  res.status(200).send('Notification received, please check log to see any errors');
};

exports.processCoreEvent = processCoreEvent;