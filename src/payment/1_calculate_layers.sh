#!/bin/bash

if [[ -d ~/compass ]]; then
  cd ~/compass/docs/private_tangle/

  scriptdir=$(dirname "$(readlink -f "$0")")
  . $scriptdir/lib.sh

  load_config

  docker run -t --rm -v /home/vagrant/compass/docs/private_tangle/data:/data \
    iota/compass/docker:layers_calculator layers_calculator_deploy.jar \
    -sigMode $sigMode \
    -seed $seed \
    -depth $depth \
    -security $security \
    -layers /data/layers

else
  echo "Skipping, Compass has not been cloned yet!"
fi
