#!/bin/bash

if [[ -d ~/compass ]]; then
  cd ~/compass/docs/private_tangle

  cp ~/src/payment/config/snapshot.txt ~/compass/docs/private_tangle/

  scriptdir=$(dirname "$(readlink -f "$0")")
  . $scriptdir/lib.sh

  load_config

  COO_ADDRESS=$(cat $scriptdir/data/layers/layer.0.csv)

  docker pull iotaledger/iri:latest
  docker run -t --net host --rm -v /home/vagrant/compass/docs/private_tangle/db:/iri/data \
    -v /home/vagrant/compass/docs/private_tangle/snapshot.txt:/snapshot.txt \
    -p 14265 iotaledger/iri:latest \
    --remote true \
    --remote-limit-api "addNeighbors, getNeighbors, removeNeighbors" \
    --testnet true \
    --testnet-coordinator $COO_ADDRESS \
    --testnet-coordinator-security-level $security \
    --testnet-coordinator-signature-mode $sigMode \
    --auto-tethering true \
    --neighbors "udp://10.0.0.31:14600" \
    --max-neighbors 5 \
    --mwm $mwm \
    --milestone-start $milestoneStart \
    --milestone-keys $depth \
    --snapshot /snapshot.txt \
    --max-depth 1000 $@

else
  echo "Skipping, Compass has not been cloned yet!"
fi
