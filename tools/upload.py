#!/usr/bin/env python

import json
import os
from lib.github import GitHub
import requests

BROWSER_LAPTOP_REPO = 'brave/browser-laptop'
RELEASE_NAME = ('PRE (DO NOT DOWNLOAD UNLESS YOU ARE TESTING '
  'THIS RELEASE CANDIDATE) Dev Channel Beta')

def main():
  github = GitHub(auth_token())
  releases = github.repos(BROWSER_LAPTOP_REPO).releases.get()
  tag = (json.load(open('package.json'))['version'] +
    release_channel() + '-' + build_label())
  tag_exists = False
  for release in releases:
    if not release['draft'] and release['tag_name'] == tag:
      tag_exists = True
      break
  release = create_or_get_release_draft(github, releases, tag,
                                        tag_exists)
  for f in get_files_to_upload():
    upload_browser_laptop(github,release, f)


def get_files_to_upload():
  matches = []
  for root, dirnames, filenames in os.walk('dist'):
    for filename in filenames:
      matches.append(os.path.join(root, filename))
  return matches


def upload_browser_laptop(github, release, file_path):
  filename = os.path.basename(file_path)
  try:
    for asset in release['assets']:
      if asset['name'] == filename:
        github.repos(BROWSER_LAPTOP_REPO).releases.assets(asset['id']).delete()
  except Exception:
    pass

  # Upload the file.
  with open(file_path, 'rb') as f:
    upload_io_to_github(github, release,
        filename, f, 'application/octet-stream')


def create_release_draft(github, tag):
  name = '{0} {1}'.format(RELEASE_NAME, tag)
  # TODO: Parse release notes from CHANGELOG.md
  body = '(placeholder)'
  if body == '':
    sys.stderr.write('Quit due to empty release note.\n')
    sys.exit(1)
  data = dict(tag_name=tag, name=name, body=body, draft=True)
  r = github.repos(BROWSER_LAPTOP_REPO).releases.post(data=data)
  return r


def create_or_get_release_draft(github, releases, tag, tag_exists):
  # Search for existing draft.
  for release in releases:
    if release['draft']:
      return release

  if tag_exists:
    tag = 'do-not-publish-me'
  return create_release_draft(github, tag)

def upload_io_to_github(github, release, name, io, content_type):
  params = {'name': name}
  headers = {'Content-Type': content_type}
  github.repos(BROWSER_LAPTOP_REPO).releases(release['id']).assets.post(
      params=params, headers=headers, data=io, verify=False)


def auth_token():
  token = os.environ['GITHUB_TOKEN']
  message = ('Error: Please set the $GITHUB_TOKEN '
             'environment variable, which is your personal token')
  assert token, message
  return token

def release_channel():
  channel = os.environ['CHANNEL']
  message = ('Error: Please set the $CHANNEL '
             'environment variable, which is your release channel')
  assert channel, message
  return channel

def build_label():
  build = os.environ['BUILD']
  message = ('Error: Please set the $BUILD '
             'environment variable, which is your build label '
             'Examples: beta5, or RC1')
  assert build, message
  return build


if __name__ == '__main__':
  import sys
  sys.exit(main())
