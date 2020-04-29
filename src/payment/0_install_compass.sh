#!/bin/bash

if [[ ! -d ~/compass ]]; then
  cd ~/
  git clone https://github.com/iotaledger/compass.git
  cd ~/compass

  # build binary and jar
  bazel build //compass:layers_calculator
  # convert it to docker image
  bazel run //docker:layers_calculator

  cp ~/src/payment/config/config.json ~/compass/docs/private_tangle/

else
  echo "Skipping, Compass already cloned"
fi