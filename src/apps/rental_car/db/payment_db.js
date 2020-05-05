const DB = require('./sqlite_db');

class PaymentDB extends DB {
  constructor() {
    super();

    this.createPaymentTable();
    this.clearPaymentTable(); // for demo, we always start with clean state
  }

  clearPaymentTable() {
    const sql = 'DELETE FROM payments';
    this.db.prepare(sql).run();
  }

  createPaymentTable() {
    const sql = ' \
      CREATE TABLE IF NOT EXISTS payments ( \
        hash TEXT PRIMARY KEY, \
        renter TEXT NOT NULL \
      );';

    this.db.prepare(sql).run();
  }

  checkIfPaymentExist(tailTxHash) {
    const sql = `SELECT hash FROM payments \
      WHERE hash = '${tailTxHash}'`;
    const rows = this.db.prepare(sql).all();

    return (rows.length == 1);
  }

  insertNewPayment(tailTxHash, renterAddress) {
    const sql = `INSERT INTO payments \
      (hash, renter) \
      VALUES \
      ('${tailTxHash}', '${renterAddress}')
    `;
    return this.db.prepare(sql).run();
  }
}

module.exports = PaymentDB;