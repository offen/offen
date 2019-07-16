import unittest
import json
import base64
from json import loads
from time import time
from os import environ

from accounts import app


def _pad_b64_string(s):
    while len(s) % 4 is not 0:
        s = s + "="
    return s


class TestKey(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()

    def test_get_key(self):
        rv = self.app.get("/api/key")
        assert rv.status.startswith("200")
        data = loads(rv.data)
        assert data["key"] == environ.get("JWT_PUBLIC_KEY")


class TestJWT(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()

    def _assert_cookie_present(self, name):
        for cookie in self.app.cookie_jar:
            if cookie.name == name:
                return cookie.value
        raise AssertionError("Cookie named {} not found".format(name))

    def _assert_cookie_not_present(self, name):
        for cookie in self.app.cookie_jar:
            assert cookie.name != name

    def test_jwt_flow(self):
        """
        First, try login attempts that are supposed to fail:
        1. checking login status without any prior interaction
        2. try logging in with an unknown user
        3. try logging in with a known user and bad password
        """
        rv = self.app.get("/api/login")
        assert rv.status.startswith("401")
        self._assert_cookie_not_present("auth")

        rv = self.app.post(
            "/api/login",
            data=json.dumps(
                {"username": "does@not.exist", "password": "somethingsomething"}
            ),
        )
        assert rv.status.startswith("401")
        self._assert_cookie_not_present("auth")

        rv = self.app.post(
            "/api/login",
            data=json.dumps({"username": "develop@offen.dev", "password": "developp"}),
        )
        assert rv.status.startswith("401")
        self._assert_cookie_not_present("auth")

        """
        Next, perform a successful login
        """
        rv = self.app.post(
            "/api/login",
            data=json.dumps({"username": "develop@offen.dev", "password": "develop"}),
        )
        assert rv.status.startswith("200")

        """
        The response should contain information about the
        user and full information (i.e. a name) about the associated accounts
        """
        data = json.loads(rv.data)
        assert data["user"]["userId"] is not None
        self.assertListEqual(
            data["user"]["accounts"],
            [
                {"name": "One", "accountId": "9b63c4d8-65c0-438c-9d30-cc4b01173393"},
                {"name": "Two", "accountId": "78403940-ae4f-4aff-a395-1e90f145cf62"},
            ],
        )

        """
        The claims part of the JWT is expected to contain a valid expiry,
        information about the user and the associated account ids.
        """
        jwt = self._assert_cookie_present("auth")
        # PyJWT strips the padding from the base64 encoded parts which Python
        # cannot decode properly, so we need to add the padding ourselves
        claims_part = _pad_b64_string(jwt.split(".")[1])
        claims = loads(base64.b64decode(claims_part))
        assert claims.get("exp") > time()

        priv = claims.get("priv")
        assert priv is not None

        assert priv.get("userId") is not None
        self.assertListEqual(
            priv["accounts"],
            [
                "9b63c4d8-65c0-438c-9d30-cc4b01173393",
                "78403940-ae4f-4aff-a395-1e90f145cf62",
            ],
        )

        """
        Checking the login status when re-using the cookie should yield
        a successful response
        """
        rv = self.app.get("/api/login")
        assert rv.status.startswith("200")
        jwt2 = self._assert_cookie_present("auth")
        assert jwt2 == jwt

        """
        Performing a bad login attempt when sending a valid auth cookie
        is expected to destroy the cookie and leave the user logged out again
        """
        rv = self.app.post(
            "/api/login",
            data=json.dumps(
                {"username": "evil@session.takeover", "password": "develop"}
            ),
        )
        assert rv.status.startswith("401")
        self._assert_cookie_not_present("auth")

        """
        Explicitly logging out leaves the user without cookies
        """
        rv = self.app.post(
            "/api/login",
            data=json.dumps({"username": "develop@offen.dev", "password": "develop"}),
        )
        assert rv.status.startswith("200")

        rv = self.app.post("/api/logout")
        assert rv.status.startswith("204")
        self._assert_cookie_not_present("auth")
