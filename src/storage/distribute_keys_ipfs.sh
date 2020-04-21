#!/usr/bin/env bash

# create a private swarm key
echo "Creating and distributing swarm key..."

echo -e "/key/swarm/psk/1.0.0/\n/base16/\n$(tr -dc 'a-f0-9' < /dev/urandom | head -c64)" > ~/.ipfs/swarm.key
# copy the file to other machine
# we use vagrant, so we use sshpass to add the password in the SCP command
sshpass -p "vagrant" scp -o StrictHostKeyChecking=no ~/.ipfs/swarm.key vagrant@notary2.local:~/.ipfs/swarm.key
sshpass -p "vagrant" scp -o StrictHostKeyChecking=no ~/.ipfs/swarm.key vagrant@notary3.local:~/.ipfs/swarm.key
sshpass -p "vagrant" scp -o StrictHostKeyChecking=no ~/.ipfs/swarm.key vagrant@notary4.local:~/.ipfs/swarm.key

# get the PeerID using this command
echo "Quering and distributing peer id..."

peer_id=$(IPFS_PATH=~/.ipfs ipfs config show | grep "PeerID" | cut -d ":" -f2 | grep -o '".*"' | sed 's/"//g')
echo -e "$peer_id" > ~/.ipfs/boot.id
# copy the file to other machine
sshpass -p "vagrant" scp -o StrictHostKeyChecking=no ~/.ipfs/boot.id vagrant@notary2.local:~/.ipfs/boot.id
sshpass -p "vagrant" scp -o StrictHostKeyChecking=no ~/.ipfs/boot.id vagrant@notary3.local:~/.ipfs/boot.id
sshpass -p "vagrant" scp -o StrictHostKeyChecking=no ~/.ipfs/boot.id vagrant@notary4.local:~/.ipfs/boot.id