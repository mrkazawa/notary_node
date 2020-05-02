const Database = require('better-sqlite3');

class DB {
  constructor() {
    this.db = new Database('rental-car.db');

    this.createTable();
    this.clearTable(); // for demo, we always start with clean state
  }

  clearTable() {
    const sql = 'DELETE FROM rental_cars';
    this.db.prepare(sql).run();
  }

  createTable() {
    const sql = ' \
      CREATE TABLE IF NOT EXISTS rental_cars ( \
        hash TEXT PRIMARY KEY, \
        owner TEXT NOT NULL, \
        fee_amount INTEGER NOT NULL, \
        fee_address TEXT NOT NULL, \
        fee_tag TEXT NOT NULL, \
        is_rented INTEGER NOT NULL, \
        renter TEXT \
      );';

    this.db.prepare(sql).run();
  }

  checkIfCarExist(ipfsHash) {
    const sql = `SELECT hash FROM rental_cars \
      WHERE hash = '${ipfsHash}'`;
    const rows = this.db.prepare(sql).all();

    return (rows.length == 1);
  }

  insertNewCar(ipfsHash, car) {
    const sql = `INSERT INTO rental_cars \
      (hash, owner, fee_amount, fee_address, fee_tag, is_rented) \
      VALUES \
      ('${ipfsHash}', '${car.owner}', '${car.paymentFee}', '${car.paymentAddress}', '${car.paymentTag}', 0)
    `;
    return this.db.prepare(sql).run();
  }

  getOneUnrentedCar() {
    const sql = `SELECT * FROM rental_cars \
      WHERE is_rented = 0 \
      LIMIT 1`;
    return this.db.prepare(sql).get();
  }

  getCarByHash(ipfsHash) {
    const sql = `SELECT * FROM rental_cars \
      WHERE hash = '${ipfsHash}'`;
    return this.db.prepare(sql).get();
  }
}

module.exports = DB;