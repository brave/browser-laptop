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

```
    snap install brave
```

## Debian (Jessie) and Ubuntu (Artful, Zesty, Yakkety, Xenial, and Trusty) AMD64:

In the terminal to be used for the below commands, prime the `sudo` command (enter your password once).
```
sudo echo
```

To install Brave using `apt` and `lsb_release`:

```
curl https://s3-us-west-2.amazonaws.com/brave-apt/keys.asc | sudo apt-key add -
echo "deb [arch=amd64] https://s3-us-west-2.amazonaws.com/brave-apt `lsb_release -sc` main" | sudo tee -a /etc/apt/sources.list.d/brave-`lsb_release -sc`.list
```

Verify the `/etc/apt/sources.list.d/brave-*.list` file lists a new repository and does not contain the word `lsb_release`. If you see the word `lsb_release` you might not have `lsb_release` installed.
 * TIP, the following command should return empty if all went well:
 ```
 grep lsb_release /etc/apt/sources.list.d/brave*
 ```


Finally, install Brave:
```
sudo apt update
sudo apt install brave
```

If you get this error when updating, you need an additional package.
> E: Some files failed to download. They have been ignored, or old ones used instead.  
 ```
sudo apt-get install apt-transport-https
 ```
To install the latest `brave-beta` which often has early staging builds:

```
curl https://s3-us-west-2.amazonaws.com/brave-apt-staging/keys.asc | sudo apt-key add -
echo "deb [arch=amd64] https://s3-us-west-2.amazonaws.com/brave-apt-staging `lsb_release -sc` main" | sudo tee -a /etc/apt/sources.list.d/brave-`lsb_release -sc`.list
sudo apt update
sudo apt install brave-beta
```

Upgrades can be done via:

```
sudo apt-get update && sudo apt-get upgrade -y
```

Alternatively you can install the deb directly but then you won't get automatic
upgrades (NOT recommended):

For Debian:
```
wget -O brave.deb https://laptop-updates.brave.com/latest/dev/debian64
sudo apt-get install -y gdebi && sudo gdebi brave.deb
```

For Ubuntu:
```
wget -O brave.deb https://laptop-updates.brave.com/latest/dev/ubuntu64
sudo dpkg -i brave.deb
```

If there are dependency errors during `dpkg -i`, the following command will
install the dependencies for you:
```
sudo apt-get -f install
```

## Linux Mint

Brave does not currently support an apt repository for Linux Mint directly, however you can use the corresponding Ubuntu package. Using the `lsb_release` method above will return an error during `apt update`.

In the terminal to be used for the below commands, prime the `sudo` command (enter your password once).
```
sudo echo
```

For Sarah, Serena and Sonya:
```
curl https://s3-us-west-2.amazonaws.com/brave-apt/keys.asc | sudo apt-key add -
echo "deb [arch=amd64] https://s3-us-west-2.amazonaws.com/brave-apt xenial main" | sudo tee -a /etc/apt/sources.list.d/brave-xenial.list
```

For Qiana, Rebecca, Rafaela and Rosa:
```
curl https://s3-us-west-2.amazonaws.com/brave-apt/keys.asc | sudo apt-key add -
echo "deb [arch=amd64] https://s3-us-west-2.amazonaws.com/brave-apt trusty main" | sudo tee -a /etc/apt/sources.list.d/brave-trusty.list
```

For LMDE Betsy:
```
curl https://s3-us-west-2.amazonaws.com/brave-apt/keys.asc | sudo apt-key add -
echo "deb [arch=amd64] https://s3-us-west-2.amazonaws.com/brave-apt jessie main" | sudo tee -a /etc/apt/sources.list.d/brave-jessie.list
```

Finally, install Brave:
```
sudo apt update
sudo apt install brave
```

Upgrades can be done via:
```
sudo apt-get update && sudo apt-get upgrade -y
```

Alternatively you can install the deb directly but then you won't get automatic upgrades (NOT recommended):
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
sudo dnf upgrade brave
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
sudo zypper addrepo --type yast2 https://s3-us-west-2.amazonaws.com/brave-rpm-release/x86_64/ brave-rpm-release
sudo zypper ref
sudo zypper install brave
```

To update Brave using zypper:
```
sudo zypper ref
sudo zypper update brave
```

If zypper throws an error similar to
```
Problem: nothing provides GConf2 needed by brave-*
 Solution 1: do not install brave-*
 Solution 2: break brave-* by ignoring some of its dependencies
```
Choose solution 2 and install gconf2 just to be safe. (`sudo zypper in gconf2`)

Alternatively you can install the rpm directly, but then you won't get automatic upgrades:
```
wget -O brave.rpm https://laptop-updates.brave.com/latest/openSUSE64
sudo rpm -i ./brave.rpm
```

## Raw x64 binaries:

```
wget https://laptop-updates.brave.com/latest/linux64 -O- | tar xj
```

Or,
```
curl -L https://laptop-updates.brave.com/latest/linux64 | tar xj
```
