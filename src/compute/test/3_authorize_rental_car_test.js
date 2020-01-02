const CarRentalContract = artifacts.require("CarRentalContract");
const truffleAssert = require('truffle-assertions');

contract('Authorizing Rental Car Test', (accounts) => {
    const notaryNodeAddress = accounts[0];
    const carOwnerAddress = accounts[1];
    const carRenterAddress = accounts[2];
    const observerAddress = accounts[3];

    const carHashInBytes = '0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231';
    const fakeHashInBytes = '0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f000';
    let CarRental;

    beforeEach('deploy contract and store a rental car', async () => {
        CarRental = await CarRentalContract.new();
        await CarRental.storeRentalCar(carHashInBytes, {
            from: carOwnerAddress
        });
    });

    it('Notary node can authorize a rental car', async () => {
        let tx = await CarRental.authorizeRentalCar(carHashInBytes, carRenterAddress, {
            from: notaryNodeAddress
        });
        truffleAssert.eventEmitted(tx, 'RentalCarRented', {
            ipfsHash: carHashInBytes,
            carRenter: carRenterAddress
        });
    });

    it('Notary node cannot authorize invalid IPFS car hash', async () => {
        // mistakenly authorize a wrong IPFS hash
        await truffleAssert.reverts(
            CarRental.authorizeRentalCar(fakeHashInBytes, carRenterAddress, {
                from: notaryNodeAddress
            }), 'car must exist'
        );
    });

    it('Notary node cannot double approve, authorizing already authorized IPFS car hash', async () => {
        await CarRental.authorizeRentalCar(carHashInBytes, carRenterAddress, {
            from: notaryNodeAddress
        });
        // mistakenly authorize the same IPFS hash (double approve)
        await truffleAssert.reverts(
            CarRental.authorizeRentalCar(carHashInBytes, carRenterAddress, {
                from: notaryNodeAddress
            }), 'car must not be rented'
        );
    });

    it('Anyone cannot authorize IPFS car hash', async () => {
        // observer trying to approve a rental car
        await truffleAssert.reverts(
            CarRental.authorizeRentalCar(carHashInBytes, carRenterAddress, {
                from: observerAddress
            }), 'only for contract owner'
        );
    });
});