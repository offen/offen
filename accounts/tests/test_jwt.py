import unittest
import json

from accounts import app


class TestJWT(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()

    def test_jwt_flow(self):
        rv = self.app.get("/api/login")
        assert rv.status.startswith("401")

        rv = self.app.post(
            "/api/login", data=json.dumps({"username": "offen", "password": "develop"})
        )
        assert rv.status.startswith("200")

        rv = self.app.get("/api/login")
        assert rv.status.startswith("200")
