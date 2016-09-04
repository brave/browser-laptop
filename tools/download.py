#!/usr/bin/env python

import sys
import os
import urllib2

url_base = 'https://github.com/brave/browser-laptop/releases/download/%s/%s'
files = [
  ['Brave.dmg', 'dist/Brave.dmg'],
  ['Brave-0.11.6.zip', 'dist/Brave-0.11.6.zip'],
  ['Brave.tar.bz2', 'dist/Brave.tar.bz2'],
  ['brave_0.11.6_amd64.deb', 'dist/brave_0.11.6_amd64.deb'],
  ['brave-0.11.6.amd64.rpm', 'dist/brave-0.11.6.amd64.rpm'],
  ['BraveSetup-ia32.exe', 'dist/ia32/BraveSetup-ia32.exe'],
  ['BraveSetup-ia32.msi', 'dist/ia32/BraveSetup-ia32.msi'],
  ['BraveSetup-x64.exe', 'dist/x64/BraveSetup-x64.exe'],
  ['BraveSetup-x64.msi', 'dist/x64/BraveSetup-x64.msi']
]

def main():
  if len(sys.argv) != 2:
    print 'usage: ./tools/download.py [release-tag]'
    sys.exit(1)

  # Create dirs
  for path in ['dist/x64', 'dist/ia32']:
    if not os.path.exists(path):
      os.makedirs(path)

  for f in files:
    url = url_base % (sys.argv[1], f[0])
    download_file(url, f[1])


# Mostly copied from: http://stackoverflow.com/a/990378/3153
def download_file(remote, local):
  u = urllib2.urlopen(remote)
  h = u.info()
  totalSize = int(h['Content-Length'])
  print 'Downloading %s to %s (%s bytes)' % (remote, local, totalSize)
  fp = open(local, 'wb')
  blockSize = 10000
  count = 0
  while True:
    chunk = u.read(blockSize)
    if not chunk:
      break
    fp.write(chunk)
    count += 1
    if totalSize > 0:
      percent = int(count * blockSize * 100 / totalSize)
      #if percent > 100:
      #  percent = 100
      print '%2d%%' % percent,
      if percent < 100:
        print '\b\b\b\b\b',  # Erase "NN% "
      else:
        print 'Done.'
  fp.flush()
  fp.close()
  if not totalSize:
    print

if __name__ == '__main__':
  import sys
  sys.exit(main())
