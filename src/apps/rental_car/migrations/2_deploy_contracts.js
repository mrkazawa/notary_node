const CarRental = artifacts.require("CarRentalContract");

module.exports = function(deployer) {
  deployer.deploy(CarRental);
};