# Core Engine Benchmark #

This note is to describe how we conduct the benchmarking of the Core Engine.

## Setup VM ##

Modify the `Vagrantfile` in `./Vagrantfile`, make sure just to use only small resource.
Higher resources does not result in higher performance as the code is not optimized for multi-threading because Node JS does not natively support multi-threading.

```ruby
BOX_MEMORY = "2048" # The number of RAM that each VM will use
BOX_CPU = 1 # The number of logical CPU that each VM will use
NODE_COUNT = 4 # The number of our notary node
```

## Setup Core Engine ##

You need to change the parameters of the Core Engine located in `./src/core/config.js`.
The config file will look something like this.

```js
// Maximum number of GENERAL request before the node bundles them in a transaction and then broadcast it to peers
this.PENDING_REQUEST_THRESHOLD = 1;

// How long the period of block generation (in milliseconds)
this.BLOCK_INTERVAL = 1000; // every 1 second

// Total number of nodes in the network
this.NUMBER_OF_NODES = 4;
// Total number of tolerable faulty nodes in the network
this.NUMBER_OF_FAULTY_NODES = 1;
// Mininum number of positive votes required for the message/block to be valid
this.MIN_APPROVALS = 2 * this.NUMBER_OF_FAULTY_NODES + 1;

// Choose only one TRUE option below
this.EDDSA_FLAG = true;
this.HMAC_FLAG = false;
this.NO_SIG_FLAG = false;

this.BENCHMARK_FLAG = true; // set true during benchmarking
this.DEBUGGING_FLAG = false; // set true to display log
this.DYNAMIC_REQUEST_POOL_FLAG = false; // set true to enable dynamic request pool size
```

There are three versions of Core Engine:

* **NO_SIG**, is without any security protection. A node just broadcast transaction in a plaintext to other peers.
* **HMAC**, The node now signs the transaction using symmetric signature before broadcasting to other peers.
* **EDDSA**, Similar to the previous one. However, the node now signs using asymmetric signature.

Choose one of them according to your needs, make sure to have ONLY ONE of the `EDDSA_FLAG`, `HMAC_FLAG`, and `NO_SIG_FLAG` set to TRUE.

After configuring, we can start the Core Engine by running:

```console
vagrant@notary1:~$ cd ~/src
vagrant@notary1:~$ npm run core1 # run this in notary 1 machine
vagrant@notary2:~$ npm run core2 # run this in notary 2 machine
vagrant@notary3:~$ npm run core3 # run this in notary 3 machine
vagrant@notary4:~$ npm run core4 # run this in notary 4 machine
```

## Running The Benchmark ##

We use [Autocannon](https://github.com/mcollina/autocannon) module to benchmark our Core Engine.
This module is an HTTP benchmarking tool that will create burst requests to our Core Engine endpoints.
The processed requests reflects the ability of our system in processing them in blocks in the blockchain.

In the first scenario, we will see the impact of the `PENDING_REQUEST_THRESHOLD` parameters.
The `PENDING_REQUEST_THRESHOLD` determines how long the notary node will wait for incoming request before it forms a transaction and broadcasts it to other peers.
We need to vary this number to 1, 5, 10, 50, 100, 250, and 500.
Then, we run the benchmark.

In the second scenario, we observe the behaviour of the Core Engine when we enable `DYNAMIC_REQUEST_POOL_FLAG`, which will set the `PENDING_REQUEST_THRESHOLD` parameters dynamically based on the current request rate that the notary node receives.
We need to set the `PENDING_REQUEST_THRESHOLD` to the value of 1 and then set the `DYNAMIC_REQUEST_POOL_FLAG` to TRUE.
Then, we run the benchmark.

Note that, we need to make sure we set the `BENCHMARK_FLAG` to TRUE and the `DEBUGGING_FLAG` to FALSE when we benchmarking.

To start the benchmark, run the following commands.

```console
foo@ubuntu:~$ npm run bench-single # run the first scenario to against one notary node
foo@ubuntu:~$ npm run bench-multi # run the first scenario against all notary nodes
foo@ubuntu:~$ npm run bench-dynamic # run the second scenario
```
