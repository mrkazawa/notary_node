# Notary Node #

This repository is the implementation of the notary node from our paper "", which is published [here]().

## Installation ##

You need `vagrant` and `virtualbox` for this project.
So install them first if you do not have it yet in your machine.
You can download them [here](https://www.vagrantup.com/downloads.html) and [here](https://www.virtualbox.org/wiki/Downloads).
All of the required softwares and tools has been included in the `Vagrantfile` and it will be installed during the `vagrant up` using shell provisioning scripts in `./shell` directory.

```console
foo@ubuntu:~$ cd ~/
foo@ubuntu:~$ git clone https://github.com/mrkazawa/notary_node.git
foo@ubuntu:~$ cd ~/notary_node

foo@ubuntu:~$ vagrant up # if it is our first time, this will take some times
foo@ubuntu:~$ vagrant rsync-auto

# open another terminal for notary1
foo@ubuntu:~$ cd ~/notary_node
foo@ubuntu:~$ vagrant ssh notary1

# open another terminal for notary2
foo@ubuntu:~$ cd ~/notary_node
foo@ubuntu:~$ vagrant ssh notary2

# open another terminal for notary3
foo@ubuntu:~$ cd ~/notary_node
foo@ubuntu:~$ vagrant ssh notary3

# open another terminal for notary4
foo@ubuntu:~$ cd ~/notary_node
foo@ubuntu:~$ vagrant ssh notary4
```

Inside the SSH instances, we need to install all of the Node JS dependencies.
Run this in all notary nodes (`notary1` to `notary4`).

```console
vagrant@notary1:~$ cd ~/src
vagrant@notary1:~$ npm install

vagrant@notary1:~$ npm run-script # show all available NPM commands
```

Other useful commands,

```console
foo@ubuntu:~$ cd ~/notary_node
foo@ubuntu:~$ vagrant reload # to restart VM
foo@ubuntu:~$ vagrant halt # to shutdwon VM
foo@ubuntu:~$ vagrant destroy -f # to completely delete VM
```

- - - -

## Running the Engines ##

### 1. Running the Core Engine ###

The original code and idea is taken from [here](https://medium.com/coinmonks/implementing-pbft-in-blockchain-12368c6c9548).
However, we already enhanced a lot of the code from that reference.

We run the core engine separately in each of the VM machines.
Run this in all notary nodes (`notary1` to `notary4`).

```console
vagrant@notary1:~$ cd ~/src
vagrant@notary1:~$ npm run core1 # run this in notary 1 machine
vagrant@notary2:~$ npm run core2 # run this in notary 2 machine
vagrant@notary3:~$ npm run core3 # run this in notary 3 machine
vagrant@notary4:~$ npm run core4 # run this in notary 4 machine
```

You will see that the VM machines start to creating blocks.
To check if the system works correctly, we can run the following commands.

```console
vagrant@notary1:~$ npm run posters
vagrant@notary1:~$ npm run getters
```

Those commands should display HTTP status of 200, indicating that the core engine server can process the commands.

### 2. Running the Storage Engine ###

Taken from [here](https://medium.com/@s_van_laar/deploy-a-private-ipfs-network-on-ubuntu-in-5-steps-5aad95f7261b).
The private key generation in the article is wrong, need to change the code in the MEDIUM link to the one provided [here](https://github.com/ipfs/go-ipfs/issues/6650).

We have to pick ***ONE*** node as the bootnode.
We choose `notary1` to be the bootnode in this experiment.
Meanwhile, other nodes serve as follower node that connects to the bootnode during boostrapings.

Notes!

- First, we SSH to the respective VM (either `notary1`, `notary2`, `notary3`, and `notary4`)
- For new installation run the following ***steps (1-4)!***
- If already installed just run the IPFS using ***step 4!***
- The following steps need to be operated in order for all nodes. After running Step 1, do not go to Step 2 directly before executing Step 1 in other nodes as well

***Run this on all nodes.***

Initiate the IPFS nodes

```console
vagrant@notary1:~$ cd ~/src/
vagrant@notary1:~$ npm run ipfs-build
```

***Run ONLY on the boot node.***

Generate private swarm key and distribute the key to other nodes

```console
vagrant@notary1:~$ npm run ipfs-distribute-keys
```

***Run this on all nodes.***

```console
# Add boostraping to points to `notary1` as a bootnode
vagrant@notary1:~$ npm run ipfs-add-boot-node

# Start the IPFS swarm node
vagrant@notary1:~$ npm run ipfs-start

# Test, stop, and destroy IPFS
vagrant@notary1:~$ npm test # if all is working correctly, the test should pass
vagrant@notary1:~$ npm run ipfs-stop
vagrant@notary1:~$ npm run ipfs-destroy
```

### Running the Compute Engine ###

At this moment, we use ganache network for our compute engine.
We use `notary1` as our master node to host the ganache network.
You can change the location of the ganache network by modifying the `web3.js` in `./src/compute/web3.js`.

```console
vagrant@notary1:~$ cd ~/src
vagrant@notary1:~$ npm run eth-network # run ganache-cli (local ethereum)
```

**TODO:** move the implementation to use Geth instead.

### 3. Running the Payment Engine ###

All of scripts used in this repo are taken from these sources:

- <https://github.com/iotaledger/compass/blob/master/docs/HOWTO_private_tangle.md>
- <https://github.com/iotaledger/compass/issues/126>
- <https://docs.iota.org/docs/compass/0.1/how-to-guides/set-up-a-private-tangle>

We need to run two nodes, IRI (IOTA node) and COO (Coordinator node).
We only need to only have one COO in our network.
Meanwhile, we can have many IRIs in our network.

For now, we still uses one IRI and one COO.
You can change the location of the IOTA network by modifying the `iota.js` in `./src/payment/iota.js`.

**TODO:** move the implementation to use multiple IRI nodes.

#### Configuration ####

There are several configurations to customize the private IOTA network (in case you do not want to use the default value we use here).
First, `seed` is like a private key for your node.
You need to keep it secret and do not share it with others.

```bash
# create a random seed
cat /dev/urandom |LC_ALL=C tr -dc 'A-Z9' | fold -w 81 | head -n 1
# keep this seed safe and private
```

Second, we need to setup the `config.json` in `./src/payment/config/config.json`.
This json will be use to configure the IRI and COO node that will also determine the properties of our private IOTA network.
The json will look something like this.

```json
{
  "seed": "MYSEEDHEREPLEASEREPLACEMEIMMEDIATELYWITHSOMETHINGSECURE99999999999999999999999999",
  "powMode": "CURLP81",
  "sigMode": "CURLP27",
  "security": 1,
  "depth": 14,
  "milestoneStart": 0,
  "mwm": 9,
  "tick": 60000,
  "host": "http://10.0.0.11:14265"
}
```

- `seed` is the random string that we generate earlier.
For simulation purpose, we can use NOT RANDOM SEED just for testing.
However, for production case, we have to generate RANDOM SEED.

- `depth` determines how many milestones that COO can create, the bigger the number, more milestones can be created and result in longer network uptime.
However, it is take longer time to process big number.
More of info can be found [here](https://docs.iota.org/docs/compass/0.1/references/merkle-tree-compute-times).

- `tick` represents the time interval on how many miliseconds the coordinator will send milestones to the network periodically.
We set this value to `60000`, which equals to 60 seconds.
Faster the tick, the COO can reach milestones faster and shorten the network uptime.
Longer the tick can result in longer transactions confirmation.

- `host` is the host of IRI node.

More configuration detail can be seen [here](https://docs.iota.org/docs/compass/0.1/references/compass-configuration-options)

Finally, we have to configure the snapshot file in `./src/payment/config/snapshot.txt`.
This file contains list of addresses and its NON-ZERO IOTA values.
It is our way to produce money in our private IOTA network.
The addressess are generated from the `seed`.
The examples of addresses are in `./src/payment/config/sender_info.json` and `./src/payment/config/receiver_info.json`.
These addresess comes with checksum.
In the snapshot, we do not need the checksum so we remove THE LAST 9 CHARACTERS!

The format of `snapshot.txt` is `<address>;<value>`.
Note that the total number of values in the snapshot MUST BE equal to `2779530283277761`

```txt
VZAWPZERLCVLNUCPGPKLNDDDGQLIODLWZNXVRYZVRHGDMKCSEEHRMJXBACJVLPGAQS9GKRJDMSMZEWKUY;1779530283277761
OM9ZFKCUDDOK9UCE9IPXENYOIPSJDCIDEEJGYCENLRFR9CIVNEBQCMWBHSROGPOGKJCABAWJHDEIITJSZ;1000000000000000
```

#### First Run ####

When everything is ready, we can run the Payment Engine with the following commands.

```console
vagrant@notary1:~$ npm run iota-init # clone and install compass
vagrant@notary1:~$ npm run iota-layer-build # compute the Merkle tree
vagrant@notary1:~$ npm run iota-iri-start # open a terminal, download and run iri
vagrant@notary1:~$ npm run iota-coo-build-and-start # open another terminal, build and run coo

vagrant@notary1:~$ npm test # if everything is success, the test should pass
```

To stop IRI or COO

```console
vagrant@notary1:~$ docker ps # get the CCONTAINER_ID
vagrant@notary1:~$ docker stop 6bd47de08e3b # docker stop <CCONTAINER_ID>
```

#### Subsequent Run ####

In case you want to start the Payment Engine again, you do not need to install all over again.
Just run this code with special care on the `npm run iota-layer-build`.
Run this command only when the coordinator reached their milestones.

```console
vagrant@notary1:~$ cd ~/src

# ONLY RUN THIS WHEN MILESTONES ALREADY REACHED!
# AT THIS POINT, THE COO IS CRASHED!
# MAKE A BIGGER DEPTH IN config.json IF NECESSARY
# THEN RUN THIS
vagrant@notary1:~$ npm run iota-layer-build

# open a terminal, then run IRI node
vagrant@notary1:~$ npm run iota-iri-start

# open another terminal, then run COO node
vagrant@notary1:~$ npm run iota-coo-start # no build (only run coo)
```

- - - -

## Known Issues ##

If the node cannot ping to one another, perhaps it has the problem with the Avahi DNS.
Try to ping to itself using the configured domain in all nodes.
Then, try to ping one another.

```console
vagrant@notary1:~$ ping notary1.local # run this in notary #1
vagrant@notary2:~$ ping notary2.local # run this in notary #2
vagrant@notary3:~$ ping notary3.local # run this in notary #3
vagrant@notary4:~$ ping notary4.local # run this in notary #4

# then try to ping one another, this should solves the issues
```

## Authors ##

- **Yustus Oktian** - *Initial work*

## Acknowledgments ##

- Hat tip to anyone whose code was used
- Fellow researchers
- Korea Government for funding this project
