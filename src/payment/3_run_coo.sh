#!/bin/bash

if [[ -d ~/compass ]]; then
  cd ~/compass/

  # build the coordinator
  bazel build //compass:coordinator
  # convert it to docker image
  bazel run //docker:coordinator

  cd ~/compass/docs/private_tangle

  scriptdir=$(dirname "$(readlink -f "$0")")
  . $scriptdir/lib.sh

  load_config

  docker run -t --net host --rm -v /home/vagrant/compass/docs/private_tangle/data:/data \
    iota/compass/docker:coordinator coordinator_deploy.jar \
    -layers /data/layers \
    -statePath /data/compass.state \
    -sigMode $sigMode \
    -powMode $powMode \
    -mwm $mwm \
    -security $security \
    -seed $seed \
    -tick $tick \
    -host $host \
    "$@"

else
  echo "Skipping, Compass has not been cloned yet!"
fi
