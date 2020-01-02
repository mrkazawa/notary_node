# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrant file configuration I learnt from here
# https://manski.net/2016/09/vagrant-multi-machine-tutorial/

BOX_IMAGE = "bento/ubuntu-16.04"
BOX_MEMORY = "4096"
BOX_CPU = 2

NODE_COUNT = 4

# Node Configuration
IPFS_BOOTNODE_ID = 1 # notary1 is the bootnode for IPFS
IOTA_COORDINATOR_ID = 4 # notary4 is the coordinator for IOTA

Vagrant.configure("2") do |config|
  (1..NODE_COUNT).each do |i|
    config.vm.define "notary#{i}" do |subconfig|
      subconfig.vm.box = BOX_IMAGE
      subconfig.vm.box_check_update = true
      subconfig.vm.hostname = "notary#{i}"
      subconfig.vm.network :private_network, ip: "10.0.0.#{i + 10}"

      subconfig.vm.provider "virtualbox" do |vb|
        vb.name = "notary#{i}"
        vb.memory = BOX_MEMORY
        vb.cpus = BOX_CPU
      end
    end
  end

  # Installing basic stuffs
  config.vm.provision "shell", path: "shell/base_install.sh", privileged: true
  config.vm.provision "shell", path: "shell/go_install.sh", privileged: true
  config.vm.provision "shell", path: "shell/ipfs_install.sh", privileged: true
  config.vm.provision "docker"

  config.vm.provision "shell", path: "shell/bazel_install.sh", privileged: false
  config.vm.provision "shell", path: "shell/conda_install.sh", privileged: false

  # node JS has to be provisioned last
  config.vm.provision "shell", path: "shell/nvm_install.sh", privileged: false

  # shared folders setup using RSYNC
  config.vm.synced_folder "src/", "/home/vagrant/src", type: "rsync"
    
  

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  # NOTE: This will enable public access to the opened port
  # config.vm.network "forwarded_port", guest: 80, host: 8080

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine and only allow access
  # via 127.0.0.1 to disable public access
  # config.vm.network "forwarded_port", guest: 80, host: 8080, host_ip: "127.0.0.1"
end