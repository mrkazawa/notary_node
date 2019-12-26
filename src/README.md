<h2>How to run:</h2>

<h3>Running the Core Engine</h3>

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



<h3>Running the Storage Engine</h3>

Taken from here
https://medium.com/@s_van_laar/deploy-a-private-ipfs-network-on-ubuntu-in-5-steps-5aad95f7261b

Run this on all nodes.
```bash
# initiate the IPFS node
IPFS_PATH=~/.ipfs ipfs init
```

Run this on all nodes.
```bash
# deleting the bootstrap node and peer identity
IPFS_PATH=~/.ipfs ipfs bootstrap rm --all
# check that the bootstrap json is empty
IPFS_PATH=~/.ipfs ipfs config show
```

The private key generation in the article is wrong, need to change the code from here
https://github.com/ipfs/go-ipfs/issues/6650

Run on boot node.
```bash
# create a private swarm key.
echo -e "/key/swarm/psk/1.0.0/\n/base16/\n$(tr -dc 'a-f0-9' < /dev/urandom | head -c64)" > ~/.ipfs/swarm.key
# copy the file to other machine
# we use vagrant, so we use sshpass to add the password in the SCP command
sshpass -p "vagrant" scp ~/.ipfs/swarm.key vagrant@notary2.local:~/.ipfs/swarm.key
sshpass -p "vagrant" scp ~/.ipfs/swarm.key vagrant@notary3.local:~/.ipfs/swarm.key
sshpass -p "vagrant" scp ~/.ipfs/swarm.key vagrant@notary4.local:~/.ipfs/swarm.key
```

Run on boot node.
```bash
# get the boot node IP from this command.
hostname -I
# get the PeerID using this command.
IPFS_PATH=~/.ipfs ipfs config show | grep "PeerID"
```

For example, in this vagrant we get IP of `10.0.0.11` and PeerID `QmS9UwaXhKHkQP4BHTa8ydRGC5yN3QxC1fNheuLf9omofm`
Then, run this on all nodes.
```bash
IPFS_PATH=~/.ipfs ipfs bootstrap add /ip4/10.0.0.11/tcp/4001/ipfs/QmS9UwaXhKHkQP4BHTa8ydRGC5yN3QxC1fNheuLf9omofm
```

Start the IPFS swarm node.
```bash
# LIBP2P_FORCE_PNET=1 is to force the IPFS to run on private network
# otherwise the IPFS daemon will fail
export LIBP2P_FORCE_PNET=1 && IPFS_PATH=~/.ipfs ipfs daemon &
```



<h3>Running the Payment Engine</h3>

https://github.com/iotaledger/compass/blob/master/docs/HOWTO_private_tangle.md

https://github.com/iotaledger/compass/issues/126

install at least `bazel 0.18` and `openjdk8` then

```bash
git clone https://github.com/iotaledger/compass.git
cd compass

# build binary and jar
bazel build //compass:coordinator
bazel build //compass:layers_calculator

# build and run local docker images
bazel build //docker:coordinator
bazel build //docker:layers_calculator
bazel run //docker:coordinator
bazel run //docker:layers_calculator

docker image list # show two images that we just created
```

