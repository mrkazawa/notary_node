const CarRentalContract = artifacts.require("CarRentalContract");

contract('Get Rental Car Detail Test', (accounts) => {
    const carOwnerAddress = accounts[1];
    const observerAddress = accounts[2];

    const carHashInBytes = '0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f231';
    const fakeHashInBytes = '0x017dfd85d4f6cb4dcd715a88101f7b1f06cd1e009b2327a0809d01eb9c91f000';
    let CarRental;

    beforeEach('deploy contract and store a rental car', async () => {
        CarRental = await CarRentalContract.new();
        await CarRental.storeRentalCar(carHashInBytes, {
            from: carOwnerAddress
        });
    });

    it('anyone can query a valid rental car', async () => {
        let rentalCar = await CarRental.getRentalCarDetail(carHashInBytes, {
            from: observerAddress
        });
        // below is the default value after storing a hash
        assert.equal(rentalCar[0], carOwnerAddress, "carOwner");
        assert.equal(rentalCar[1], 0, "carRenter");
        assert.equal(rentalCar[2], true, "isValid");
        assert.equal(rentalCar[3], false, "isRented");
    });

    it('anyone can query a fake rental car', async () => {
        let rentalCar = await CarRental.getRentalCarDetail(fakeHashInBytes, {
            from: observerAddress
        });
        // below is the default value for unknown hash
        assert.equal(rentalCar[0], 0, "carOwner");
        assert.equal(rentalCar[1], 0, "carRenter");
        assert.equal(rentalCar[2], false, "isValid");
        assert.equal(rentalCar[3], false, "isRented");
    });
});