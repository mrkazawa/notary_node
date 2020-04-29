# Bash file for Vagrant provisioning only
# It will called automatically during the FIRST 'vagrant up'
# When boxes already created, we can provision again by adding '--provision' param

# For instance,
# vagrant up --provision
# vagrant reload --provision

# update linux package repo
apt-get update

# -------------------------------- For Networking -------------------------------- #

apt-get install -y avahi-daemon libnss-mdns
apt-get install -y sshpass

# -------------------------------- For IOTA -------------------------------- #

apt-get install -y g++ unzip zip
apt-get install -y jq
apt-get install -y openjdk-8-jdk
apt-get install maven