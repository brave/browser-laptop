#!/usr/bin/env python

import hashlib
import json
import os
import subprocess
import tempfile
import urllib2

GETH_MANAGER_CONFIG_PATH = 'gethBinaries.json'
RELEASE_URL = 'https://api.github.com/repos/ethereum/go-ethereum/releases/latest'
COMMIT_URL = 'https://api.github.com/repos/ethereum/go-ethereum/commits/%s'
PLATFORMS_TEMPLATE = {
  "linux": {
      "x64": {
          "download": {
              "baseurl": "https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-{version}-{sha}.{suffix}",
              "type": "tar"
          },
          "bin": "geth"
      },
      "ia32": {
          "download": {
              "baseurl": "https://gethstore.blob.core.windows.net/builds/geth-linux-386-{version}-{sha}.{suffix}",
              "type": "tar"
          },
          "bin": "geth"
      }
  },
  "mac": {
      "x64": {
          "download": {
              "baseurl": "https://gethstore.blob.core.windows.net/builds/geth-darwin-amd64-{version}-{sha}.{suffix}",
              "type": "tar"
          },
          "bin": "geth"
      }
  },
  "win": {
      "x64": {
          "download": {
              "baseurl": "https://gethstore.blob.core.windows.net/builds/geth-windows-amd64-{version}-{sha}.{suffix}",
              "type": "zip"
          },
          "bin": "geth.exe"
      },
      "ia32": {
          "download": {
              "baseurl": "https://gethstore.blob.core.windows.net/builds/geth-windows-386-{version}-{sha}.{suffix}",
              "type": "zip"
          },
          "bin": "geth.exe"
      }
  }
}
SUFFIX = {
  'tar': 'tar.gz',
  'zip': 'zip'
}

# key_ids = ['0xA61A13569BA28146', '0x558915E17B9E2481', '0x9417309ED2A67EAC']
# for key_id in key_ids:
    # subprocess.check_call(['gpg', '--keyserver', 'keyserver.ubuntu.com', '--recv', key_id])
# os.exit()

print('Fetching latest release...')

req = urllib2.Request(RELEASE_URL)
resp = urllib2.urlopen(req)
latest = json.load(resp)
tag = latest['tag_name']

if tag[0] != 'v':
    os.exit("Invalid tag")
version = tag[1:]

print('Version %s available' % version)
print('Fetching associated commit sha')

req = urllib2.Request(COMMIT_URL % tag)
resp = urllib2.urlopen(req)
commit = json.load(resp)
sha = commit['sha'][:8]

print('Version %s has sha %s' % (version, sha))

platform_config = PLATFORMS_TEMPLATE
for platform in platform_config.keys():
    ossep = '/'
    if platform == 'win':
        ossep = '\\'

    for arch in platform_config[platform].keys():
        plat_arch_template = platform_config[platform][arch]

        download_info = { 'type': plat_arch_template['download']['type'] }

        download_info['url'] = plat_arch_template['download']['baseurl'].format(
            version=version,
            sha=sha,
            suffix=SUFFIX[plat_arch_template['download']['type']]
        )

        archive_name = download_info['url'].split('/')[-1]
        archive_folder, ext = os.path.splitext(archive_name)
        if ext == '.gz':
            archive_folder, _ = os.path.splitext(archive_folder)
        download_info['bin'] = ossep.join((archive_folder, plat_arch_template['bin']))

        outfd, temp_geth_path = tempfile.mkstemp()
        with os.fdopen(outfd, 'w') as temp_geth:
            print('Downloading %s...' % download_info['url'])

            req = urllib2.Request(download_info['url'])
            resp = urllib2.urlopen(req)
            geth_body = resp.read()

            sha256 = hashlib.sha256()
            sha256.update(geth_body)
            geth_sha256 = sha256.hexdigest()

            temp_geth.write(geth_body)
            temp_geth.flush()

            outfd2, temp_geth_asc_path = tempfile.mkstemp()
            with os.fdopen(outfd2, 'w') as temp_geth_asc:
                asc_url = '%s.asc' % download_info['url']
                print('Downloading %s...' % asc_url)

                req = urllib2.Request(asc_url)
                resp = urllib2.urlopen(req)
                geth_asc_body = resp.read()

                temp_geth_asc.write(geth_asc_body)
                temp_geth_asc.flush()

                print('Verifying signature...')
                subprocess.check_call(['gpg', '--verify', temp_geth_asc_path, temp_geth_path])
                download_info['sha256'] = geth_sha256

        platform_config[platform][arch]['download'] = download_info
        platform_config[platform][arch]['commands'] = {
            'sanity': {
                'args': [ 'version' ],
                'output': [ 'Geth', version ]
            }
        }

print("Writing %s" % GETH_MANAGER_CONFIG_PATH)
with open(GETH_MANAGER_CONFIG_PATH, 'w') as f:
    json.dump(
        { 'clients': { 'Geth': { 'platforms': platform_config, 'version': version } } }, 
        f, 
        sort_keys=True,
        indent=4, 
        separators=(',', ': '),
    )
print("Done!")
