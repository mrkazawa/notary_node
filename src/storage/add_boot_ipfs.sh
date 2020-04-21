#!/usr/bin/env bash

# set parameters
BOOT_ID=$(cat ~/.ipfs/boot.id)
BOOT_IP="10.0.0.11"

# add boostrap to refer to notary1 as a bootnode
IPFS_PATH=~/.ipfs ipfs bootstrap add /ip4/$BOOT_IP/tcp/4001/ipfs/$BOOT_ID