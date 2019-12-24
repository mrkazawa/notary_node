# Bash file for Vagrant provisioning only
# It will called automatically during the FIRST 'vagrant up'
# When boxes already created, we can provision again by adding '--provision' param

# For instance,
# vagrant up --provision
# vagrant reload --provision

# update linux package repo
apt-get update
# --------------------------- installing Avahi DNS and mDNS --------------------------- #
apt-get install -y avahi-daemon libnss-mdns

#--------------------------- installing Anaconda --------------------------- #
MINI_CONDA=Miniconda2-4.7.12.1-Linux-x86_64.sh
CONDA_BASH=/opt/anaconda/etc/profile.d/conda.sh

if [[ ! -f $CONDA_BASH ]]
then
    cd /home/vagrant
    
    if [[ ! -f $MINI_CONDA ]]; then
        wget --quiet https://repo.anaconda.com/miniconda/$MINI_CONDA
    fi
    
    chmod +x $miniconda
    ./$miniconda -b -p /opt/anaconda
    
cat >> /home/vagrant/.bashrc << END
# add for anaconda install
PATH=/opt/anaconda/bin:\$PATH
END
    
    source /home/vagrant/.bashrc
    
else
    echo "Skipping, Anaconda is already installed"
    source /opt/anaconda/etc/profile.d/conda.sh
fi

#---------------------------