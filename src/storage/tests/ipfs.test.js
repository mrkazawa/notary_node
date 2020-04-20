const ipfs_engine = require('../ipfs_engine');
const fs = require('fs');

const CAR_DATA_PATH = '/home/vagrant/src/storage/tests/car_data.json';
const carDataTemplate = {
  timestamp: 0,
  manufacturer: 'Hyundai',
  model: 'M15',
  color: 'black',
  license: 'LOST 1234',
  year: 2017,
  paymentAddress: 'send_me_money',
  paymentTag: 'tag',
  paymentFee: 1,
};

test('Storing JSON file', async () => {
  const json = JSON.stringify(carDataTemplate);
  fs.writeFileSync(CAR_DATA_PATH, json, {
    encoding: 'utf8',
    flag: 'w'
  });

  const ipfsHash = await ipfs_engine.storeJsonFromLocalFile(CAR_DATA_PATH);
  expect(ipfs_engine.isValidIpfsHash(ipfsHash)).toBe(true);

  const queried = await ipfs_engine.getJsonFromIpfsHash(ipfsHash);
  expect(queried).toEqual(carDataTemplate);
});