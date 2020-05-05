const Database = require('better-sqlite3');

class DB {
  constructor() {
    /**if (DB._instance) {
      // Singleton class.
      // This allows the constructor to be called multiple times
      // and refer to the same instance.
      return DB._instance;
    }
    DB._instance = this;**/

    if ('instance' in this.constructor) {
      return this.constructor.instance;
    }

    this.constructor.instance = this;

    this.db = new Database('rental-car.db');
  }
}

module.exports = DB;