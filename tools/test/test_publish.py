#!/usr/bin/env python

import sys
import unittest
import os

dirname = os.path.dirname(os.path.realpath(__file__))
sys.path.append(os.path.join(dirname, '..'))

import publish_release

from mock import Repo

class TestPublishGetDraft(unittest.TestCase):
    def setUp(self):
        self.repo = Repo()

    def test_fails_on_existing_release(self):
        self.repo.releases._releases = [{'tag_name': 'test', 'draft': False}]
        self.assertRaises(UserWarning, publish_release.get_draft, self.repo, 'test')

    def test_fails_on_no_draft(self):
        self.repo.releases._releases = [{'tag_name': 'old', 'draft': False}]
        self.assertRaises(UserWarning, publish_release.get_draft, self.repo, 'new')

    def test_succeeds_on_existing_draft(self):
        self.repo.releases._releases = [{'tag_name': 'test', 'draft': True}]
        publish_release.get_draft(self.repo, 'test')

if __name__ == '__main__':
    print unittest.main()