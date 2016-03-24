# Linux install instructions

Signed packages are on their way, but in the meantime you can use the following.

## Debian AMD64:

```
wget -O brave.deb https://laptop-updates.brave.com/latest/dev/debian64
sudo dpkg -i ./brave.deb
```

## Ubuntu AMD64:

```
wget -O brave.deb https://laptop-updates.brave.com/latest/dev/ubuntu64
sudo dpkg -i ./brave.deb
```

## Mint AMD64:

```
wget -O brave.deb https://laptop-updates.brave.com/latest/mint64
sudo dpkg -i ./brave.deb
```

## Fedora AMD64:

```
sudo yum install lsb
wget -O brave.rpm https://laptop-updates.brave.com/latest/fedora64
sudo rpm -i ./brave.rpm
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
