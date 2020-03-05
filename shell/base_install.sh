# Bash file for Vagrant provisioning only
# It will called automatically during the FIRST 'vagrant up'
# When boxes already created, we can provision again by adding '--provision' param

# For instance,
# vagrant up --provision
# vagrant reload --provision

# update linux package repo
apt-get update

# installing Avahi DNS and mDNS
apt-get install -y avahi-daemon libnss-mdns

# installing sshpass
apt-get install -y sshpass

# -------------------------------- For IOTA -------------------------------- #
# reguirement for Bazel
apt-get install -y g++ unzip zip
# to run the shells
apt-get install -y jq
# for compiling java
apt-get install -y openjdk-8-jdk