
class Repo():
    def __init__(self):
        self.releases = self.Releases()

    class Releases():
        def __init__(self):
            self._releases = []
        def get(self):
            return self._releases
