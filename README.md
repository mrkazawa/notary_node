# Notary Node #

## Installation ##

All of the required softwares and tools has been included in the `Vagrantfile` and it will be installed during the `vagrant up` using shell provisioning scripts in `/shell` directory.

## How to run ##

### Running the Core Engine ###

In `notary1`

```bash
SECRET="NODE0" P2P_PORT=5100 HTTP_PORT=3000 node app
```

In `notary2`

```bash
SECRET="NODE1" P2P_PORT=5100 HTTP_PORT=3000 PEERS=ws://notary1.local:5100 node app
```

In `notary3`

```bash
SECRET="NODE2" P2P_PORT=5100 HTTP_PORT=3000 PEERS=ws://notary2.local:5100,ws://notary1.local:5100 node app
```

In `notary4`

```bash
SECRET="NODE2" P2P_PORT=5100 HTTP_PORT=3000 PEERS=ws://notary3.local:5100,ws://notary2.local:5100,ws://notary1.local:5100 node app
```

- - - -

### Running the Storage Engine ###

Taken from here
<https://medium.com/@s_van_laar/deploy-a-private-ipfs-network-on-ubuntu-in-5-steps-5aad95f7261b>

We have to pick ***ONE*** node as the bootnode. For example, we choose `notary1` to be the bootnode in this experiment. Meanwhile, other nodes serve as follower node that connects to the bootnode during boostrapings.

Notes!

- For new installation run the following ***steps (1-4)!***
- If already installed just run the IPFS using ***step 4!***

#### 1. Initiate the IPFS nodes ####

***Run this on all nodes.***

```bash
# initiate the IPFS node
IPFS_PATH=~/.ipfs ipfs init
# deleting the bootstrap node and peer identity
IPFS_PATH=~/.ipfs ipfs bootstrap rm --all
```

#### 2. Generate private swarm key and distribute the key to other nodes ####

The private key generation in the article is wrong, need to change the code in the MEDIUM link to the one provided here
<https://github.com/ipfs/go-ipfs/issues/6650>

***Run ONLY on the boot node.***

```bash
# create a private swarm key
echo -e "/key/swarm/psk/1.0.0/\n/base16/\n$(tr -dc 'a-f0-9' < /dev/urandom | head -c64)" > ~/.ipfs/swarm.key
# copy the file to other machine
# we use vagrant, so we use sshpass to add the password in the SCP command
sshpass -p "vagrant" scp ~/.ipfs/swarm.key vagrant@notary2.local:~/.ipfs/swarm.key
sshpass -p "vagrant" scp ~/.ipfs/swarm.key vagrant@notary3.local:~/.ipfs/swarm.key
sshpass -p "vagrant" scp ~/.ipfs/swarm.key vagrant@notary4.local:~/.ipfs/swarm.key
# get the boot node IP from this command
hostname -I
# get the PeerID using this command
IPFS_PATH=~/.ipfs ipfs config show | grep "PeerID"
```

For example, in this vagrant we get IP of `10.0.0.11` and PeerID `QmS9UwaXhKHkQP4BHTa8ydRGC5yN3QxC1fNheuLf9omofm`

#### 3. Add boostraping to points to `notary1` as a bootnode ####

***Run this on all nodes.***

```bash
# IPFS_PATH=~/.ipfs ipfs bootstrap add /ip4/<ip_address>/tcp/4001/ipfs/<peer_id>

# add boostrap to refer to notary1 as a bootnode
IPFS_PATH=~/.ipfs ipfs bootstrap add /ip4/10.0.0.11/tcp/4001/ipfs/QmS9UwaXhKHkQP4BHTa8ydRGC5yN3QxC1fNheuLf9omofm
```

#### 4. Start the IPFS swarm node ####

***Run this on all nodes.***

```bash
# By default, IPFS dameon is only accessible through localhost
# To make it be accessible from other hosts use this
IPFS_PATH=~/.ipfs ipfs config Addresses.API /ip4/0.0.0.0/tcp/5001
IPFS_PATH=~/.ipfs ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/9001

# LIBP2P_FORCE_PNET=1 is to force the IPFS to run on private network
# otherwise the IPFS daemon will fail
export LIBP2P_FORCE_PNET=1 && IPFS_PATH=~/.ipfs ipfs daemon &

# in case we want to shutdown the daemon
ipfs shutdown
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
cd /compass/docs/private_tangle
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
