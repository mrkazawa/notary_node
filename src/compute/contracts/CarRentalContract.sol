pragma solidity >=0.4.25 <0.6.0;

contract CarRentalContract {

    struct RentalCar {
        address carOwner; // the address of the car owner
		address carRenter; // the address to the current car renter
        bool isValue; // true when payload is stored
        bool isRented; // true when the car is currently rented
	}

    address public owner;
    // the key is the 'ipfsHash'
    mapping (bytes32 => RentalCar) public rentalCars;

    event NewRentalCarAdded(bytes32 ipfsHash, address carOwner);
    event RentalCarRented(bytes32 ipfsHash, address carRenter);

    modifier carMustExist(bytes32 ipfsHash) {
        require(rentalCars[ipfsHash].isValue, "car must exist");
        _;
    }

    modifier carMustNotExist(bytes32 ipfsHash) {
        require(!rentalCars[ipfsHash].isValue, "car must not exist");
        _;
    }

    modifier carMustNotRented(bytes32 ipfsHash) {
        require(!rentalCars[ipfsHash].isRented, "car must not be rented");
        _;
    }

    modifier onlyForOwner() {
        require(owner == msg.sender, "only for contract owner");
        _;
    }

    constructor() public {
		owner = msg.sender;
	}

    function storeRentalCar(bytes32 ipfsHash) public
    carMustNotExist(ipfsHash) {
        RentalCar storage r = rentalCars[ipfsHash];
        r.carOwner = msg.sender;
        r.isValue = true;

        emit NewRentalCarAdded(ipfsHash, msg.sender);
    }

    function authorizeRentalCar(bytes32 ipfsHash, address carRenter) public
    carMustExist(ipfsHash)
    carMustNotRented(ipfsHash)
    onlyForOwner() {
        rentalCars[ipfsHash].isRented = true;
        rentalCars[ipfsHash].carRenter = carRenter;

        emit RentalCarRented(ipfsHash, carRenter);
    }

    function getRentalCarDetail(bytes32 ipfsHash) public view
    returns (address, address, bool, bool) {
        return (rentalCars[ipfsHash].carOwner,
        rentalCars[ipfsHash].carRenter,
        rentalCars[ipfsHash].isValue,
        rentalCars[ipfsHash].isRented);
    }
}