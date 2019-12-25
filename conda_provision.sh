#--------------------------- installing Anaconda ---------------------------#

MINI_CONDA=Miniconda2-4.7.12.1-Linux-x86_64.sh

cd /home/vagrant
mkdir conda_installer
cd conda_installer

if [[ ! -f $MINI_CONDA ]]; then
    wget --quiet https://repo.anaconda.com/miniconda/$MINI_CONDA
    chmod +x $MINI_CONDA
    ./$MINI_CONDA -b -p /home/vagrant/anaconda
    
    cat >> /home/vagrant/.bashrc << END
# add for anaconda install
PATH=/home/vagrant/anaconda/bin:\$PATH
END
    
    source /home/vagrant/.bashrc
else
    echo "Skipping, Anaconda is already installed"
fi

source /home/vagrant/anaconda/etc/profile.d/conda.sh