const events = require('events');

class CoreEvent {
  constructor() {
    if (CoreEvent._instance) {
      // this allows the constructor to be called multiple times
      // and refer to the same instance. Another option is to
      // throw an error.
      return CoreEvent._instance;
    }
    CoreEvent._instance = this;

    this.event = new events.EventEmitter();
  }

  getEvent() {
    return this.event;
  }
}

module.exports = CoreEvent;