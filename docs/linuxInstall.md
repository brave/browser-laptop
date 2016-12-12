# Linux install instructions

## Debian or Ubuntu AMD64:
To install brave using apt:
``` 
curl https://s3-us-west-2.amazonaws.com/brave-apt/keys.asc | sudo apt-key add -
echo "deb https://s3-us-west-2.amazonaws.com/brave-apt [xenial/trusty] main" | sudo tee -a /etc/apt/sources.list
sudo apt update
sudo apt install brave -y
```

Upgrades can be done via:
```
apt-get update && apt-get upgrade -y
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
