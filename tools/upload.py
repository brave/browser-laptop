#!/usr/bin/env python
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

import json
import os
from lib.github import GitHub
from lib.helpers import *
import requests

TARGET_ARCH= os.environ['TARGET_ARCH'] if os.environ.has_key('TARGET_ARCH') else 'x64'

def main():
  print('[INFO] Running upload...')
  repo = GitHub(get_env('GITHUB_TOKEN')).repos(BROWSER_LAPTOP_REPO)

  sanity_check(repo, get_tag())

  release = create_release_draft(repo, get_tag())
  print('[INFO] Uploading release {}'.format(release['tag_name']))
  for f in get_files_to_upload():
    upload_browser_laptop(repo, release, f)
  print('[INFO] Finished upload')

def sanity_check(repo, tag):
  releases = get_releases_by_tag(repo, tag, include_drafts=True)
  print('[INFO] Existing releases: {}'.format([x['tag_name'] for x in releases]))
  if releases:
    raise(UserWarning("Draft with tag {} already exists".format(tag)))

def upload_browser_laptop(github, release, file_path):
    filename = os.path.basename(file_path)
    print('[INFO] Uploading: ' + filename)

    # Upload the file.
    with open(file_path, 'rb') as f:
        if filename == 'RELEASES':
          filename = 'RELEASES-{0}'.format(TARGET_ARCH)
        upload_io_to_github(github, release,
            filename, f, 'application/octet-stream')

def create_release_draft(repo, tag):
    name = '{0} {1}'.format(release_name(), tag)
    # TODO: Parse release notes from CHANGELOG.md
    body = '(placeholder)'
    data = dict(tag_name=tag, name=name, body=body, draft=True)
    return repo.releases.post(data=data)

def get_files_to_upload():
    matches = []
    for root, dirnames, filenames in os.walk('dist'):
        for filename in filenames:
          matches.append(os.path.join(root, filename))
    return matches

def upload_io_to_github(github, release, name, io, content_type):
    params = {'name': name}
    headers = {'Content-Type': content_type}
    github.releases(release['id']).assets.post(
        params=params, headers=headers, data=io, verify=False)

if __name__ == '__main__':
  import sys
  sys.exit(main())
