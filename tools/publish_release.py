#!/usr/bin/env python

import json
import os
from lib.github import GitHub
import requests

BROWSER_LAPTOP_REPO = 'brave/browser-laptop'
TARGET_ARCH= os.environ['TARGET_ARCH'] if os.environ.has_key('TARGET_ARCH') else 'x64'
RELEASE_NAME = 'Dev Channel Beta'

def main():
  github = GitHub(auth_token())
  releases = github.repos(BROWSER_LAPTOP_REPO).releases.get()
  tag = ('v' + json.load(open('package.json'))['version'] +
    release_channel())
  tag_exists = False
  for release in releases:
    if not release['draft'] and release['tag_name'] == tag:
      tag_exists = True
      break
  release = create_or_get_release_draft(github, releases, tag,
                                        tag_exists)

  # Press the publish button.
  publish_release(github, release['id'])

def create_release_draft(github, tag):
  name = '{0} {1}'.format(RELEASE_NAME, tag)
  # TODO: Parse release notes from CHANGELOG.md
  body = '(placeholder)'
  if body == '':
    sys.stderr.write('Quit due to empty release note.\n')
    sys.exit(1)
  data = dict(tag_name=tag, name=name, body=body, draft=True, prerelease=True)
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

def publish_release(github, release_id):
  data = dict(draft=False)
  github.repos(BROWSER_LAPTOP_REPO).releases(release_id).patch(data=data)

if __name__ == '__main__':
  import sys
  sys.exit(main())
