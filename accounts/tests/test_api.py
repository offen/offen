import unittest
import json
import base64
from json import loads
from time import time
from datetime import datetime, timedelta
from os import environ

import jwt

from accounts import app


FOREIGN_PRIVATE_KEY = """
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCwAPFiTSLKlVvG
N97TIyDWIxPp4Ji8hAmtlMn0gdGclC2DGKA2v7orXdNkngFon0PPe08acKI5NL9P
nkVSrjWxrn8H7LeNQadwPxjYVmri4SLhBJUcAe+SoqrIZtrci+2y64mLPrl6wxBj
ZKDl8o1Qm8iZSMgJ+wRG2FrItZUBWLZ79KSB2lQkO5OWorPX3T0SPxQXqq9hc4xN
6I+qtfmv5jZTJOviMCehOs48ZlObgr/W+Kak4q/jrrqXvG3XQqVVTN/z95+2XuN4
Btj7fv24PIRE/BddDAzC/yzISYb9QqLChaxx1fqY+aSA6ou2wh1PjUiyXNnAmP2i
6UWwikILAgMBAAECggEBAJuYmc1/x+w00qeQKQubmKH27NnsVtsCF9Q/H7NrOTYl
wX6OPMVqBlnkXsgq76/gbQB2UN5dCO1t9lua3kpT/OASFfeZjEPy8OXIwlwvOdtN
kZpAhNn31CZcbIMyevZTNlbg5/4T+8HNxSU5hw0Cu2+x6UuqDj7UjVlcWBXsgchn
f8kguLHr6Q7rndC10Vv5a4Rz9fzuS2K4jEnhlJjgD22XB2SCH5kLrAikH10AW761
5g7HSiMxKSUyXc51PX3n/FkxjzT0Vm1ENeZou263VEQhke49IWLIcbLD7ShOyNaI
TuYPAyRY4o70/d/YTydRCEp/H8stB6UaVK9hlzzfoMECgYEA1e9UgW4vBueSoZv3
llc7dXlAnk6nJeCaujjPBAd0Sc3XcpMik1kb8oDgI4fwNxTYqlHu3Wp7ZLR14C4G
rlry+4rRUdxnWNcKtyOtA6km0b33V3ja4GsLViENBSQZDUe7EljER2VSRynMTog0
lfmUr+ORzWDpanEO+Ke25zhU2DsCgYEA0pxM2UjmmAepSWBAcXABjIFE09MxXVTS
NwRhdYjHJsKmGnPD8DEDJbRSHNAEN2mTD2kJW5pFThKVWtQ8WpjSXuRSkS7HzXrU
zMNZnzTDdTZl6nnui3RJtIYntSXR7ommC6ldY7nlnHnzkIEcDLwN6E/JNOB5gtTE
L4ztUpKncHECgYBO3qHX6agasorjW52mZlh8UYxaEIMcurYwSzs+sATWJLX1/npz
uhlMiOiZEMelduD9waD/Lf95u/HtCOrbopoL1DyhIlFTdkv0AooJXHX8Qz2JmPuQ
WsZeJWcoawt1UumLtP//lkIEDEvO8/X3CIEhaxNYlQ7Yd//d+e67RZA5+wKBgD6f
qR4m1iI4jPa7fw377wn3Wh7eOlx1Hziqvcv0CruUv004RPfDqxrn/k6A7/AGHWtE
oTqyqY7oaa6jUvrhXBRJMd/nmBOaRXJJV/nF96R/s1hAP1UKE+xww5fSkhSqq0vm
ZVWE7ihT/r9mFJAYzs3YA40MfjUPzPISpnKaFt2RAoGBANCtswMqztcuPDF5rL3d
rqB6jwFrXKvwrx4HxOmF/MgGPyp6MWLBEnpZDvLJo9uSafq6Q6IwOQMWWF5GO7JO
4EG9ldVugR/CtmL3+XTHE4MGPXmqHg/q/o7rItc7g11iXJTndcUZtWGwkHwl4zBF
15NFZ2gU4rKnQ3sVAOzMoEw5
-----END PRIVATE KEY-----
"""

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
        data["user"]["accounts"].sort(key=lambda a: a["name"])
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

    def test_forged_token(self):
        """
        The application needs to verify that tokens that would be theoretically
        valid are not signed using an unknown key.
        """
        forged_token = jwt.encode(
            {
                "exp": datetime.utcnow() + timedelta(hours=24),
                "priv": {
                    "userId": "8bc8db1b-f32d-4376-a1cf-724bf6a597b8",
                    "accounts": [
                        "9b63c4d8-65c0-438c-9d30-cc4b01173393",
                        "78403940-ae4f-4aff-a395-1e90f145cf62",
                    ],
                },
            },
            FOREIGN_PRIVATE_KEY,
            algorithm="RS256",
        ).decode()

        self.app.set_cookie("localhost", "auth", forged_token)
        rv = self.app.get("/api/login")
        assert rv.status.startswith("401")
