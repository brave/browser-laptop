#!/usr/bin/env python
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

import os
import json

BROWSER_LAPTOP_REPO = 'brave/browser-laptop'
TARGET_ARCH= os.environ['TARGET_ARCH'] if os.environ.has_key('TARGET_ARCH') else 'x64'

def get_env(env):
    token = os.environ[env]
    message = ('Error: Please set the ${} environment variable, which is your personal token'.format(env))
    assert token, message
    return token

def release_channel():
    channel = os.environ['CHANNEL']
    message = ('Error: Please set the $CHANNEL '
                'environment variable, which is your release channel')
    assert channel, message
    return channel

def get_channel_display_name():
    d = {'dev': 'Release', 'beta': 'Beta', 'developer': 'Developer', 'nightly': 'Nightly'}
    return d[release_channel()]

def release_name():
    return '{0} Channel'.format(get_channel_display_name())

def get_tag():
    return 'v' + get_version() + get_channel_display_name()

def get_version():
    return json.load(open('package.json'))['version']

def get_releases_by_tag(repo, tag_name, include_drafts=False):
    if include_drafts:
        return [r for r in repo.releases.get() if r['tag_name'] == tag_name]
    else:
        return [r for r in repo.releases.get() if r['tag_name'] == tag_name and not r['draft']]
