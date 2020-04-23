#!/usr/bin/env bash

IPFS_INSTALLER=go-ipfs_v0.4.18_linux-amd64.tar.gz

cd /home/vagrant
mkdir ipfs_installer
cd ipfs_installer

if [[ ! -f $IPFS_INSTALLER ]]; then
    wget --quiet https://dist.ipfs.io/go-ipfs/v0.4.18/$IPFS_INSTALLER
    tar xvfz $IPFS_INSTALLER
    mv go-ipfs/ipfs /usr/local/bin/ipfs
else
    echo "Skipping, IPFS is already installed"
fi