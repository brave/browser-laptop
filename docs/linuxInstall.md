# Linux install instructions

Signed packages are on their way, but in the meantime you can use the following.

**NOTE**: _If you experience a problem with dependencies while installing, you may
want to try installing `git` using the package manager for your distro._

## Debian AMD64:
To install brave using apt:
``` 
curl https://s3-us-west-2.amazonaws.com/brave-apt/keys.asc | sudo apt-key add -
deb https://s3-us-west-2.amazonaws.com/brave-apt jesse main  
```

Upgrades can be done via:
```
apt-get update && apt-get upgrade -y
```

Alternatively you can install the deb directly but then you wont get automatic upgrades with apt
```
wget -O brave.deb https://laptop-updates.brave.com/latest/dev/debian64
sudo apt-get install -y gdebi && sudo gdebi brave.deb
```

## Ubuntu AMD64:
To install brave using apt:
``` 
curl https://s3-us-west-2.amazonaws.com/brave-apt/keys.asc | sudo apt-key add -
deb https://s3-us-west-2.amazonaws.com/brave-apt [xenial/trusty] main  
```

Upgrades can be done via:
```
apt-get update && apt-get upgrade -y
```
Alternatively you can install the deb directly but then you wont get automatic upgrades with apt
```
wget -O brave.deb https://laptop-updates.brave.com/latest/dev/ubuntu64
sudo dpkg -i ./brave.deb
```

## Mint AMD64:

```
wget -O brave.deb https://laptop-updates.brave.com/latest/mint64
sudo dpkg -i ./brave.deb
```

## Fedora x86_64:

```
sudo dnf install lsb
wget -O brave.rpm https://laptop-updates.brave.com/latest/fedora64
sudo dnf install ./brave.rpm
```

## OpenSUSE AMD64:

```
sudo zypper install lsb
wget -O brave.rpm https://laptop-updates.brave.com/latest/openSUSE64
sudo rpm -i ./brave.rpm
```

## Raw x64 binaries:

```
wget -O brave.tar.bz2 https://laptop-updates.brave.com/latest/linux64
tar xvjf brave.tar.bz2
```
