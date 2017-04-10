# Linux install instructions

**NOTE**: _If you experience a problem with dependencies while installing, you may
want to try installing `git` using the package manager for your distro._

**NOTE**: _If Brave does not start and shows an error about sandboxing, you may need
to [enable userns in your kernel](https://superuser.com/questions/1094597/enable-user-namespaces-in-debian-kernel#1122977). Running with the `--no-sandbox` flag is NOT recommended!_

## Debian (jessie) and Ubuntu (Trusty and Xenial) AMD64:
To install brave using apt and lsb\_release :

``` 
curl https://s3-us-west-2.amazonaws.com/brave-apt/keys.asc | sudo apt-key add -
echo "deb [arch=amd64] https://s3-us-west-2.amazonaws.com/brave-apt `lsb_release -sc` main" | sudo tee -a /etc/apt/sources.list.d/brave-`lsb_release -sc`.list
```

You will want to make sure the /etc/apt/sources.list.d/brave-\*.list file lists a new repository and does not contain the word lsb\_release. If you see the word lsb\_release you might not have lsb\_release installed. Otherwise run:

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
wget -O brave.deb https://laptop-updates.brave.com/latest/dev/debian64
sudo apt-get install -y gdebi && sudo gdebi brave.deb
```
or for ubuntu
```
wget -O brave.deb https://laptop-updates.brave.com/latest/dev/ubuntu64
sudo dpkg -i ./brave.deb
```

If there are dependency errors during `dpkg -i`, the following command will
install the dependency for you:
```
sudo apt-get -f install
```

## Mint AMD64:

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

To install brave using dnf:

```
sudo dnf config-manager --add-repo https://s3-us-west-2.amazonaws.com/brave-rpm-release/x86_64/
sudo rpm --import https://s3-us-west-2.amazonaws.com/brave-rpm-release/keys.asc 
sudo dnf install brave
```

To update brave using dnf:

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

To install brave using zypper:

```
sudo rpmkeys --import https://s3-us-west-2.amazonaws.com/brave-rpm-release/keys.asc
sudo zypper install lsb
sudo zypper addrepo https://s3-us-west-2.amazonaws.com/brave-rpm-release/x86_64/ brave-rpm-release
sudo zypper ref
sudo zypper install brave
```

To update brave using zypper:

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
wget -O brave.tar.bz2 https://laptop-updates.brave.com/latest/linux64
tar xvjf brave.tar.bz2
```
