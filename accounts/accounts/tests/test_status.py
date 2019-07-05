import unittest

from accounts import app


class TestStatus(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()

    def test_get(self):
        rv = self.app.get("/status")
        assert rv.status.startswith("200")
        assert b"ok" in rv.data
