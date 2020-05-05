const Database = require('better-sqlite3');

class DB {
  constructor() {
    if ('instance' in this.constructor) {
      return this.constructor.instance;
    }

    this.constructor.instance = this;

    this.db = new Database('rental-car.db');
  }
}

module.exports = DB;