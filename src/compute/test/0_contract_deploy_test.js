const CarRentalContract = artifacts.require("CarRentalContract");

contract('Contract Deployment Test', (accounts) => {
    let CarRental;

    beforeEach('deploy contract', async () => {
        CarRental = await CarRentalContract.new();
    });

    it('Contract should deployed properly', async () => {
        let contractOwner = await CarRental.owner.call();
        assert.equal(contractOwner, accounts[0], "truffle assign the first account as contract deployer by default");
    });
});