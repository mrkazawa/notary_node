const DB = require('../db/sqlite_db');
const db = new DB();

const getUnrentedCar = function (req, res) {
  const unrentedCar = db.getOneUnrentedCar();
  res.status(200).send(JSON.stringify(unrentedCar));
};

exports.getUnrentedCar = getUnrentedCar;