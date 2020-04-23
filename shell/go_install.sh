#!/usr/bin/env bash

GO_INSTALLER=go1.11.4.linux-amd64.tar.gz

cd /home/vagrant
mkdir go_installer
cd go_installer

if [[ ! -f $GO_INSTALLER ]]; then
    wget --quiet https://storage.googleapis.com/golang/$GO_INSTALLER
    tar -C /usr/local -xzf $GO_INSTALLER

    cat >> /home/vagrant/.bashrc << END
# add for go install
PATH=/usr/local/go/bin:\$PATH
END

    source /home/vagrant/.bashrc
else
    echo "Skipping, GO is already installed"
fi