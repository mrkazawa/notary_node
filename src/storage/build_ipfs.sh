#!/usr/bin/env bash

#### 1. Initiate the IPFS nodes ####

# initiate the IPFS node
IPFS_PATH=~/.ipfs ipfs init
# deleting the bootstrap node and peer identity
IPFS_PATH=~/.ipfs ipfs bootstrap rm --all