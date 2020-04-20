#!/usr/bin/env bash

# By default, IPFS dameon is only accessible through localhost
# To make it be accessible from other hosts use this
IPFS_PATH=~/.ipfs ipfs config Addresses.API /ip4/0.0.0.0/tcp/5001
IPFS_PATH=~/.ipfs ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/9001

# LIBP2P_FORCE_PNET=1 is to force the IPFS to run on private network
# otherwise the IPFS daemon will fail
export LIBP2P_FORCE_PNET=1 && IPFS_PATH=~/.ipfs ipfs daemon &