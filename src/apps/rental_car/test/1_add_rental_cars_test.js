const CarRentalContract = artifacts.require("CarRentalContract");
const truffleAssert = require('truffle-assertions');

contract('Storing Rental Car Test', (accounts) => {
  const carOwnerAddress = accounts[1];

  const carHashInBytes = '0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231';
  let CarRental;

  beforeEach('deploy contract', async () => {
    CarRental = await CarRentalContract.new();
  });

  it('car owner can store the IPFS hash of his car', async () => {
    let tx = await CarRental.storeRentalCar(carHashInBytes, {
      from: carOwnerAddress
    });
    truffleAssert.eventEmitted(tx, 'NewRentalCarAdded', {
      ipfsHash: carHashInBytes,
      carOwner: carOwnerAddress
    });
  });

  it('car owner can not double save, storing the same IPFS hash twice', async () => {
    await CarRental.storeRentalCar(carHashInBytes, {
      from: carOwnerAddress
    });
    // mistakenly store the same IPFS hash (double save)
    await truffleAssert.reverts(
      CarRental.storeRentalCar(carHashInBytes, {
        from: carOwnerAddress
      }), 'car must not exist'
    );
  });
});