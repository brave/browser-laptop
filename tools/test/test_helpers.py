#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

import sys
import unittest
import os

dirname = os.path.dirname(os.path.realpath(__file__))
sys.path.append(os.path.join(dirname, '..'))
from lib.helpers import *

class RetryFunc():
  def __init__(self):
    self.ran = 0
    self.calls = []
    self.err = UserWarning

  def succeed(self, count):
    self.ran = self.ran + 1
    self.calls.append(count)

  def fail(self, count):
    self.ran = self.ran + 1
    self.calls.append(count)
    raise self.err

class TestRetryFunc(unittest.TestCase):
  def setUp(self):
    self.retry_func = RetryFunc()
    self.catch_func = RetryFunc()

  def test_passes_retry_count(self):
    self.assertRaises(
      self.retry_func.err,
      retry_func,
      self.retry_func.fail,
      catch=UserWarning, retries=3
    )
    self.assertEqual(self.retry_func.calls, [0, 1, 2, 3])

  def test_retries_on_fail(self):
    self.assertRaises(
      self.retry_func.err,
      retry_func,
      self.retry_func.fail,
      catch=UserWarning, retries=3
    )
    self.assertEqual(self.retry_func.ran, 4)

  def test_run_catch_func_on_fail(self):
    self.assertRaises(
      self.retry_func.err,
      retry_func,
      self.retry_func.fail,
      catch_func=self.catch_func.succeed,
      catch=UserWarning, retries=3
    )
    self.assertEqual(self.catch_func.ran, 4)

  def test_no_retry_on_success(self):
    retry_func(
      self.retry_func.succeed,
      catch=UserWarning, retries=3
    )
    self.assertEqual(self.retry_func.ran, 1)

  def test_no_run_catch_func_on_success(self):
    retry_func(
      self.retry_func.succeed,
      catch_func=self.catch_func.succeed,
      catch=UserWarning, retries=3
    )
    self.assertEqual(self.catch_func.ran, 0)

if __name__ == '__main__':
  print unittest.main()
