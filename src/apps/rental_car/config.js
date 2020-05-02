const os = require("os");
const HOSTNAME = os.hostname();

/**
 * Specify one hostname to be a master.
 * 
 * If there are two or more notary nodes connected to the same compute engine
 * with the same NETWORK ID and (no parallelism), both of them will get events.
 * Moreover, all notary nodes will also get notification from the Core Engine.
 * Then, we have to determine which node is the leader to process the next
 * application steps.
 * 
 * Since, we do not have a leader election algorithm yet in the notary nodes.
 * We hard coded the role of master in this file.
 * 
 * TODO: do the leader election for this.
 */
const MASTER = 'notary1';

var configs = {
  isMasterNode: function () {
    return (HOSTNAME == MASTER);
  }
}

module.exports = configs;