set -e
sudo apt-get update
sudo apt-get install -y dkms build-essential linux-headers-$(uname -r) clang libdbus-1-dev libgtk2.0-dev libnotify-dev libgconf2-dev \
                       libasound2-dev libcap-dev libcups2-dev libxtst-dev libxss1 libnss3-dev gcc-multilib g++-multilib libxss-dev libpci-dev libpulse-dev libexif-dev
sudo apt-get install -y virtualbox-guest-dkms virtualbox-guest-utils virtualbox-guest-x11
sudo apt-get install -y --no-install-recommends ubuntu-desktop xterm
sudo sh -c "echo '[SeatDefaults]
autologin-user=vagrant
autologin-user-timeout=0
user-session=ubuntu
greeter-session=unity-greeter' >/etc/lightdm/lightdm.conf"
sudo apt-get install -y git
sudo apt-get install -y curl
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g node-gyp@3.2.1
sudo service lightdm start
# install yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install yarn
