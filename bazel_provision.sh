#--------------------------- installing Bazel ---------------------------#

BAZEL_VERSION="1.2.1"
BAZEL_INSTALLER="bazel-$BAZEL_VERSION-installer-linux-x86_64.sh"

cd /home/vagrant
mkdir bazel_installer
cd bazel_installer

if [[ ! -f $GO_INSTALLER ]]; then
    wget --quiet https://github.com/bazelbuild/bazel/releases/download/$BAZEL_VERSION/$BAZEL_INSTALLER
    chmod +x $BAZEL_INSTALLER
    ./$BAZEL_INSTALLER --user

    cat >> /home/vagrant/.bashrc << END
# add for bazel install
PATH=$PATH:$HOME/bin
END

    source /home/vagrant/.bashrc
else
    echo "Skipping, Bazel is already installed"
fi