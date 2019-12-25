# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrant file configuration I learnt from here
# https://manski.net/2016/09/vagrant-multi-machine-tutorial/

BOX_IMAGE = "bento/ubuntu-16.04"
BOX_MEMORY = "4096"
BOX_CPU = 2

NODE_COUNT = 3

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

  config.vm.synced_folder "src/", "/home/vagrant/src", type: "rsync"

  config.vm.provision "shell", path: "provision.sh", privileged: true
  config.vm.provision "shell", path: "go_provision.sh", privileged: true
  config.vm.provision "shell", path: "ipfs_provision.sh", privileged: true

  config.vm.provision "shell", path: "conda_provision.sh", privileged: false
  config.vm.provision "shell", path: "nvm_provision.sh", privileged: false

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
