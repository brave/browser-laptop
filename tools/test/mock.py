#!/usr/bin/env python
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.

class Repo():
    def __init__(self):
        self.releases = self.Releases()

    class Releases():
        def __init__(self):
            self._releases = []
        def get(self):
            return self._releases
