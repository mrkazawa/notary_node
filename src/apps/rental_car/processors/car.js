const CarDB = require('../db/car_db');
const carDB = new CarDB();

const getUnrentedCar = function (req, res) {
  const unrentedCar = carDB.getOneUnrentedCar();
  res.status(200).send(JSON.stringify(unrentedCar));
};

exports.getUnrentedCar = getUnrentedCar;