# Core Engine Benchmark (Broadcasting Transaction)

This document shows how to benchmark our `Core Engine` for demonstration purpose.

## Getting Started

These instructions will let you run multiple instances of our "stripped out" `Core Engine` code.
Therefore, the code is simple but incomplete only for the sake of this demonstration.

### Setup

Modify the `Vagrantfile` in `/`, make sure just to use small resource.
Higher resources does not result in higher performance as the code is not optimized for multi-threading (Node JS sucks haha!)

```ruby
BOX_MEMORY = "2048" # The number of RAM that each VM will use
BOX_CPU = 1 # The number of logical CPU that each VM will use
NODE_COUNT = 4 # The number of our notary node
```

There are three version of `Core Engine`:

* **NO_SIG**, is without any security protection. A node just broadcast transaction in a plaintext to other peers.
* **HMAC**, The node now signs the transaction using symmetric signature before broadcasting to other peers.
* **EDDSA**, Similar to the previous one. However, the node now signs using asymmetric signature.

Each `Core Engine` has their own configuration.
Depending on which version of `Core Engine` that you will use, you have to first modify the `config.js` in corresponding directory.

```shell
cd /src/benchmark/broadcast_tx/no_sig # for NO-SIG
cd /src/benchmark/broadcast_tx/hmac # for HMAC
cd /src/benchmark/broadcast_tx/eddsa # for EDDSA
```

You need to change these two variables to match needs.

```js
// Maximum number of request before the node send a bundle them in a transaction
// and then broadcast it to peers
const PENDING_REQUEST_THRESHOLD = 100;
// Total number of nodes in the network
const NUMBER_OF_NODES = 4;
```

### Installing

Simply install all of the required Node JS modules.

```shell
cd /src/benchmark
npm install
```

## Running The Benchmark

Our benchmarking involves two big steps: running notary nodes, and then run the benchmark code.

### Run Notary Nodes

Explain what these tests test and why

```shell
# Choose one of the following, depending on core engine version
cd /src/benchmark/broadcast_tx/no_sig # for NO-SIG
cd /src/benchmark/broadcast_tx/hmac # for HMAC
cd /src/benchmark/broadcast_tx/eddsa # for EDDSA

# On notary1 terminal run this
SECRET="NODE0" P2P_PORT=5100 HTTP_PORT=3000 node app

# On notary2 terminal run this
SECRET="NODE1" P2P_PORT=5100 HTTP_PORT=3000 PEERS=ws://notary1.local:5100 node app

# On notary3 terminal run this
SECRET="NODE2" P2P_PORT=5100 HTTP_PORT=3000 PEERS=ws://notary2.local:5100,ws://notary1.local:5100 node app

# On notary4 terminal run this
SECRET="NODE3" P2P_PORT=5100 HTTP_PORT=3000 PEERS=ws://notary3.local:5100,ws://notary2.local:5100,ws://notary1.local:5100 node app
```

### Run The Benchmark

We use [Autocannon](https://github.com/mcollina/autocannon) module to benchmark our `Core Engine`.

Open another terminal (preferably this terminal IS NOT INSIDE VM).
Then run the following:

```shell
cd /src/benchmark/broadcast_tx
node bench_notary.js
```

**BONUS!!!** You can also use the `record_to_csv.js` to capture the CPU, RAM, and NETWORKING usage inside each of the VMs.

## Authors

* **Yustus Oktian** - *Initial work*

## Acknowledgments

* Hat tip to anyone whose code was used
* Fellow researchers
* Korea Government for funding this project
