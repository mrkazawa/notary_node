#--------------------------- Installing Node Version Manager ---------------------------#

NVM_INSTALLER=install.sh

cd /home/vagrant
if [[ ! -f $NVM_INSTALLER ]]; then
    wget --quiet https://raw.githubusercontent.com/creationix/nvm/v0.34.0/$NVM_INSTALLER
    chmod +x $NVM_INSTALLER
    ./$NVM_INSTALLER

    source $HOME/.nvm/nvm.sh
    # Install latest stable node and make it default
    nvm install stable
    nvm alias default stable
else
    echo "Skipping, NVM is already installed"
fi