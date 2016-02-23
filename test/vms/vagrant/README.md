# Brave Vagrant VMs

## Requirements

1. Install [Virtual Box](https://www.virtualbox.org/wiki/Downloads)
2. Install [Vagrant](https://www.vagrantup.com/downloads.html)

## Usage

In the OS folder run `vagrant up` to start the VM. See [Getting Started](https://www.vagrantup.com/docs/getting-started/) for details on using vagrant. The VMs use [rsync shared folders](https://www.vagrantup.com/docs/synced-folders/rsync.html) to share the code in your local repo (excluding node_modules, git and build dirs). These folders will only sync on `vagrant up` and `vagrant reload`. If you want them to stay in sync with your local files you must run `vagrant rsync-auto` in the OS folder or use the npm commands.

NOTE: If https://github.com/brave/electron is checked out in the same directory as https://github.com/brave/browser-laptop it will be shared as well
