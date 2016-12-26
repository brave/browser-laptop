# Linux install instructions

**NOTE**: _If you experience a problem with dependencies while installing, you may
want to try installing `git` using the package manager for your distro._

## Debian (jessie) and Ubuntu (Trusty and Xenial) AMD64:
To install brave using apt and lsb\_release :

``` 
curl https://s3-us-west-2.amazonaws.com/brave-apt/keys.asc | sudo apt-key add -
echo "deb [arch=amd64] https://s3-us-west-2.amazonaws.com/brave-apt `lsb_release -sc` main" | sudo tee -a /etc/apt/sources.list
```

You will want to make sure the bottom line of /etc/apt/sources.list lists a new repository and doesn not contain the word lsb\_release. If you see the word lsb\_release you might not have lsb\_release installed. Otherwise run

```
sudo apt update
sudo apt install brave
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
or for ubuntu
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
