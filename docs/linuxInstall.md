# Linux install instructions

**NOTE**: _If you experience a problem with dependencies while installing, you may
want to try installing `git` using the package manager for your distro._

**NOTE**: _If Brave does not start and shows an error about sandboxing, you may need
to [enable userns in your kernel](https://superuser.com/questions/1094597/enable-user-namespaces-in-debian-kernel#1122977). Running with the `--no-sandbox` flag is NOT recommended!_

## Snapcraft

According to [snapcraft.io](https://snapcraft.io/):

> Snaps are quick to install, easy to create, safe to run, and they update
automatically and transactionally so your app is always fresh and never broken.

Installation instructions for `snapd` [can be found here](https://snapcraft.io/docs/core/install).
Once `snapd` is installed, installing Brave looks like this:

    snap install Brave --beta

## Debian (Jessie) and Ubuntu (Artful, Zesty, Yakkety, Xenial, and Trusty) AMD64:

To install Brave using apt and lsb\_release :

```
curl https://s3-us-west-2.amazonaws.com/brave-apt/keys.asc | sudo apt-key add -
echo "deb [arch=amd64] https://s3-us-west-2.amazonaws.com/brave-apt `lsb_release -sc` main" | sudo tee -a /etc/apt/sources.list.d/brave-`lsb_release -sc`.list
```

You will want to make sure the /etc/apt/sources.list.d/brave-\*.list file lists a new repository and does not contain the word lsb\_release. If you see the word lsb\_release you might not have lsb\_release installed. Otherwise run:

```
sudo apt update
sudo apt install brave
```

To install the latest which also often has early staging builds:

```
curl https://s3-us-west-2.amazonaws.com/brave-apt-staging/keys.asc | sudo apt-key add -
echo "deb [arch=amd64] https://s3-us-west-2.amazonaws.com/brave-apt-staging `lsb_release -sc` main" | sudo tee -a /etc/apt/sources.list.d/brave-`lsb_release -sc`.list
```

Upgrades can be done via:

```
apt-get update && apt-get upgrade -y
```

Alternatively you can install the deb directly but then you won't get automatic
upgrades:

```
wget -O brave.deb https://laptop-updates.brave.com/latest/dev/debian64
sudo apt-get install -y gdebi && sudo gdebi brave.deb
```

Or for Ubuntu

```
wget -O brave.deb https://laptop-updates.brave.com/latest/dev/ubuntu64
sudo dpkg -i brave.deb
```

If there are dependency errors during `dpkg -i`, the following command will
install the dependency for you:

```
sudo apt-get -f install
```

## Linux Mint

Brave does not currently support an apt repository for Linux Mint directly, but
you can use the corresponding Ubuntu package. Using the lsb\_release method
above will return an error during `apt update`.

For Sarah, Serena and Sonya:

```
curl https://s3-us-west-2.amazonaws.com/brave-apt/keys.asc | sudo apt-key add -
echo "deb [arch=amd64] https://s3-us-west-2.amazonaws.com/brave-apt xenial main" | sudo tee -a /etc/apt/sources.list.d/brave-xenial.list
```

Or for Qiana, Rebecca, Rafaela and Rosa:

```
curl https://s3-us-west-2.amazonaws.com/brave-apt/keys.asc | sudo apt-key add -
echo "deb [arch=amd64] https://s3-us-west-2.amazonaws.com/brave-apt trusty main" | sudo tee -a /etc/apt/sources.list.d/brave-trusty.list
```

Or for LMDE Betsy:

```
curl https://s3-us-west-2.amazonaws.com/brave-apt/keys.asc | sudo apt-key add -
echo "deb [arch=amd64] https://s3-us-west-2.amazonaws.com/brave-apt jessie main" | sudo tee -a /etc/apt/sources.list.d/brave-jessie.list
```

Then install Brave with:

```
sudo apt update
sudo apt install brave
```

Upgrades can be done via:

```
apt-get update && apt-get upgrade -y
```

Alternatively you can install the deb directly but then you won't get automatic upgrades:

```
wget -O brave.deb https://laptop-updates.brave.com/latest/mint64
sudo dpkg -i ./brave.deb
```

If there are dependency errors during `dpkg -i`, the following command will
install the dependency for you:

```
sudo apt-get -f install
```

## Fedora x86_64:

To install Brave using dnf:

```
sudo dnf config-manager --add-repo https://s3-us-west-2.amazonaws.com/brave-rpm-release/x86_64/
sudo rpm --import https://s3-us-west-2.amazonaws.com/brave-rpm-release/keys.asc
sudo dnf install brave
```

To update Brave using dnf:

```
dnf upgrade brave
```

Alternatively you can install the rpm directly, but then you won't get automatic upgrades:

```
sudo dnf install lsb
wget -O brave.rpm https://laptop-updates.brave.com/latest/fedora64
sudo dnf install ./brave.rpm
```

## OpenSUSE AMD64:

To install Brave using zypper:

```
sudo rpmkeys --import https://s3-us-west-2.amazonaws.com/brave-rpm-release/keys.asc
sudo zypper install lsb
sudo zypper addrepo https://s3-us-west-2.amazonaws.com/brave-rpm-release/x86_64/ brave-rpm-release
sudo zypper ref
sudo zypper install brave
```

To update Brave using zypper:

```
sudo zypper ref
sudo zypper update brave
```

Alternatively you can install the rpm directly, but then you won't get automatic upgrades:

```
wget -O brave.rpm https://laptop-updates.brave.com/latest/openSUSE64
sudo rpm -i ./brave.rpm
```

## Raw x64 binaries:

```
wget https://laptop-updates.brave.com/latest/linux64 -O- | tar xj
```
