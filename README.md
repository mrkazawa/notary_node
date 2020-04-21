# Notary Node #

## Installation ##

All of the required softwares and tools has been included in the `Vagrantfile` and it will be installed during the `vagrant up` using shell provisioning scripts in `/shell` directory.

```bash
git clone https://github.com/mrkazawa/notary_node.git
cd notary_node

vagrant up # if it is our first time, this will take some times
vagrant rsync-auto

# open another terminal for notary1
vagrant ssh notary1
# open another terminal for notary2
vagrant ssh notary2
# open another terminal for notary3
vagrant ssh notary3
# open another terminal for notary4
vagrant ssh notary4
```

Other useful commands,

```bash
cd notary_node
vagrant reload # to restart VM
vagrant halt # to shutdwon VM
vagrant destroy -f # to completely delete VM
```

- - - -

## How to run ##

### Running the Core Engine ###

After we SSH to the respective VM (either `notary1`, `notary2`, `notary3`, and `notary4`).
We need to go to the Core Engine directory

```bash
cd src/core
npm install # install all the required Node JS packages
```

Then, we run the core engine separately in each of the VM machines.

```bash
npm run notary1 # run this in notary 1 machine
npm run notary2 # run this in notary 2 machine
npm run notary3 # run this in notary 3 machine
npm run notary4 # run this in notary 4 machine
```

You will see that the VM machines start to creating blocks.
To check if the system works correctly, we can run the following commands.

```bash
npm run posters
npm run getters
```

Those commands should display HTTP status of 200, indicating that the core engine server can process the commands.

- - - -

### Running the Storage Engine ###

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

#### 1. Initiate the IPFS nodes ####

***Run this on all nodes.***

```bash
npm run build
```

#### 2. Generate private swarm key and distribute the key to other nodes ####

***Run ONLY on the boot node.***

```bash
npm run distribute-keys
```

#### 3. Add boostraping to points to `notary1` as a bootnode ####

***Run this on all nodes.***

```bash
npm run add-boot-node
```

#### 4. Start the IPFS swarm node ####

***Run this on all nodes.***

```bash
cd ~/src/storage
npm install # installing all the dependencies

npm run start # to start IPFS daemon
```

#### 5. Test, stop, and destroy IPFS ####

```bash
npm test # if all is working correctly, the test should pass

npm run stop # to stop IPFS daemon
npm run destroy # to destroy IPFS

```

- - - -

### Running the Compute Engine ###

```bash
cd ~/src/compute
npm install # installing all the dependencies

npm run network # run ganache-cli (local ethereum)
```

- - - -

### Running the Payment Engine ###

Taken from these sources:

- <https://github.com/iotaledger/compass/blob/master/docs/HOWTO_private_tangle.md>
- <https://github.com/iotaledger/compass/issues/126>
- <https://docs.iota.org/docs/compass/0.1/how-to-guides/set-up-a-private-tangle>

***WHEN THIS IS NOT OUR FIRST TIME SETUP!***

Just run this code.

```bash
# ONLY RUN THIS WHEN MILESTONES ALREADY REACHED!
# AT THIS POINT, THE COO IS CRASHED!
# MAKE A BIGGER DEPTH IN config.json
# THEN RUN THIS
cd ~/compass/docs/private_tangle
./01_calculate_layers.sh

# run IRI node
./02_run_iri.sh
# run COO node, without bootstrap
./03_run_coordinator.sh -broadcast
```

Otherwise, follow all of these procedures

#### 1. Get the code ####

```bash
# get compass from our forked repo
git clone https://github.com/mrkazawa/compass.git
cd compass
```

#### 2. Compute the Merkle tree ####

```bash
# build binary and jar
bazel build //compass:layers_calculator
# convert it to docker image
bazel run //docker:layers_calculator
# to check if it is indeed created
docker image list

# create a random seed
cat /dev/urandom |LC_ALL=C tr -dc 'A-Z9' | fold -w 81 | head -n 1
# keep this seed safe and private

# copy the seed to config.json
cd docs/private_tangle
cp config.example.json config.json
nano config.json
```

Edit the `config.json` so that to have the `seed` points to our previous randomly generated seed.
For simulation purpose, we can use NOT RANDOM SEED just for testing.
However, for production case, we have to generate RANDOM SEED.

Then, we configure the `depth` to a lower value to save time to build the tree.
For example, we set it to have the value of `16`.
The `depth` of the tree will impact on the network uptime.
The coordinator will crash when it reaches the latest milestones.
More of info can be found here <https://docs.iota.org/docs/compass/0.1/references/merkle-tree-compute-times>

We can also configure the `tick` value.
This value represent how many miliseconds the coordinator will send milestones to the network.
We set this value to `60000`, which 60 seconds.
The longer the `tick`, the fewer transactions can be confirmed.

More configuration detail can be seen here <https://docs.iota.org/docs/compass/0.1/references/compass-configuration-options>

```json
{
  "seed": "MYSEEDHEREPLEASEREPLACEMEIMMEDIATELYWITHSOMETHINGSECURE99999999999999999999999999",
  "powMode": "CURLP81",
  "sigMode": "CURLP27",
  "security": 1,
  "depth": 16,
  "milestoneStart": 0,
  "mwm": 9,
  "tick": 60000,
  "host": "http://localhost:14265"
}
```

After setup the `config.json`.
***Then, finally we run this***

```bash
./01_calculate_layers.sh
```

#### 3. Run an IRI node ####

Create an IOTA snapshot.
This contains list of addresses and its NON-ZERO IOTA values.
The addressess are generated from the SEED.
For this project we use two sender and receiver seeds that can be find in the `src/payment/sender_info.json` and `src/payment/receiver_info.json`

```bash
touch snapshot.txt
nano snapshot.txt
```

Add this the following texts to the file.
It contains lists of sender addresses all with `1000` IOTA.
The address in `src/payment/sender_info.json` and `src/payment/receiver_info.json` are with checksum.
In the snapshot we do not need the checksum so we remove THE LAST 9 CHARACTERS!
The format of `snapshot.txt` is `<address>;<value>`.
Total number of values in the snapshot need to be equal to `2779530283277761`

```txt
VZAWPZERLCVLNUCPGPKLNDDDGQLIODLWZNXVRYZVRHGDMKCSEEHRMJXBACJVLPGAQS9GKRJDMSMZEWKUY;1779530283277761
OM9ZFKCUDDOK9UCE9IPXENYOIPSJDCIDEEJGYCENLRFR9CIVNEBQCMWBHSROGPOGKJCABAWJHDEIITJSZ;1000000000000000
```

***Then, finally we run this***

```bash
./02_run_iri.sh
```

Open other terminal to continue.

#### 4. Run Compass ####

First, we build and create docker image.

```bash
cd ~/compass/

# build the coordinator
bazel build //compass:coordinator
# convert it to docker image
bazel run //docker:coordinator
# to check if it is indeed created
docker image list

cd docs/private_tangle
```

***Then, finally we run this***

```bash
./03_run_coordinator.sh -bootstrap -broadcast
```

#### To stop IRI node or Compass node ####

```bash
docker ps # get the CCONTAINER_ID
# docker stop <CCONTAINER_ID>
docker stop 6bd47de08e3b
```

- - - -

## Known Issues ##

If the node cannot ping to one another, perhaps it has the problem with the Avahi DNS.
Try to ping to itself using the configured domain in all nodes.
Then, try to ping one another.

```bash
ping notary1.local # run this in notary #1
ping notary2.local # run this in notary #1
ping notary3.local # run this in notary #1
ping notary4.local # run this in notary #1

# then try to ping one another, this should solves the issues
```

## Authors ##

- **Yustus Oktian** - *Initial work*

## Acknowledgments ##

- Hat tip to anyone whose code was used
- Fellow researchers
- Korea Government for funding this project