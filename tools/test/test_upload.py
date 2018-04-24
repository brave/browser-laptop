#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

import sys
import unittest
import os

dirname = os.path.dirname(os.path.realpath(__file__))
sys.path.append(os.path.join(dirname, '..'))

import upload

from mock import Repo

class TestPublishSanityCheck(unittest.TestCase):
  def setUp(self):
    self.repo = Repo()

  def test_fails_on_existing_draft(self):
    self.repo.releases._releases = [{'tag_name': 'test', 'draft': True}]
    self.assertRaises(UserWarning, upload.sanity_check, self.repo, 'test')

  def test_fails_on_existing_release(self):
    self.repo.releases._releases = [{'tag_name': 'test', 'draft': False}]
    self.assertRaises(UserWarning, upload.sanity_check, self.repo, 'test')

  def test_succeeds_on_new_release(self):
    self.repo.releases._releases = [{'tag_name': 'old', 'draft': False}]
    upload.sanity_check(self.repo, 'new')

if __name__ == '__main__':
  print unittest.main()
