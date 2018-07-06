#!/usr/bin/env python

import os
import subprocess
import sys
import os.path
MUON_VERSION = '7.1.5'
CHROMEDRIVER_VERSION = '2.37'
SOURCE_ROOT = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
TARGET_ARCH= os.environ['TARGET_ARCH'] if os.environ.has_key('TARGET_ARCH') else 'x64'
os.environ['npm_config_arch'] = TARGET_ARCH

def execute(argv, env=os.environ):
  print ' '.join(argv)
  try:
    output = subprocess.check_output(argv, stderr=subprocess.STDOUT, env=env)
    print output
    return output
  except subprocess.CalledProcessError as e:
    print e.output
    raise e

def write_npmrc():
  data = 'runtime = electron\n' \
  'target_arch = %s\n' \
  'brave_electron_version = %s\n' \
  'chromedriver_version = %s\n' \
  'target = v%s\n' \
  'disturl=https://brave-laptop-binaries.s3.amazonaws.com/atom-shell/dist/\n' \
  'build_from_source = true\n' % (TARGET_ARCH, MUON_VERSION, CHROMEDRIVER_VERSION, MUON_VERSION)
  f = open('.npmrc','wb')
  f.write(data)
  f.close()


def run_script(script, args=[]):
  sys.stderr.write('\nRunning ' + script +'\n')
  sys.stderr.flush()
  script = os.path.join(SOURCE_ROOT, 'tools', script)
  try:
    output = subprocess.check_output([sys.executable, script] + args, stderr=subprocess.STDOUT)
    print output
  except subprocess.CalledProcessError as e:
    print e.output
    raise e


PLATFORM = {
  'cygwin': 'win32',
  'darwin': 'darwin',
  'linux2': 'linux',
  'win32': 'win32',
}[sys.platform]

is_linux = PLATFORM == 'linux'
is_windows = PLATFORM == 'win32'
is_darwin = PLATFORM == 'darwin'

deps = []
if is_darwin:
  deps = ['GITHUB_TOKEN', 'CHANNEL', 'IDENTIFIER']
elif is_windows:
  deps = ['GITHUB_TOKEN', 'CHANNEL', 'CERT_PASSWORD', 'TARGET_ARCH']
else:
  deps = ['GITHUB_TOKEN', 'CHANNEL']

if any(not os.environ.has_key(v) for v in deps):
  print 'Missing some environment variables', deps
  sys.exit(1)

execute(['git', 'pull'])
execute(['rm', '-Rf', 'node_modules'])
execute(['rm', '-Rf', 'Brave-%s-%s' % (PLATFORM, TARGET_ARCH)])
execute(['rm', '-Rf', 'dist'])

write_npmrc()

npm = 'npm.cmd' if is_windows else 'npm'
execute([npm, 'install'])

execute(['node', './tools/electronBuilderHack.js'])

# For whatever reason on linux pstinstall webpack isn't running
if is_linux:
  execute([npm, 'run', 'webpack'])

execute([npm, 'run', 'build-package'])
execute([npm, 'run', 'build-installer'])

run_script('upload.py', sys.argv[1:])
