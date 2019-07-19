from datetime import datetime, timedelta
from functools import wraps

from flask import jsonify, make_response, request
from flask_cors import cross_origin
from passlib.hash import bcrypt
import jwt

from accounts import app
from accounts.models import User

COOKIE_KEY = "auth"


def json_error(handler):
    @wraps(handler)
    def wrapped_handler(*args, **kwargs):
        try:
            return handler(*args, **kwargs)
        except Exception as server_error:
            return (
                jsonify(
                    {
                        "error": "Internal server error: {}".format(str(server_error)),
                        "status": 500,
                    }
                ),
                500,
            )

    return wrapped_handler


class UnauthorizedError(Exception):
    pass


@app.route("/api/login", methods=["POST"])
@cross_origin(origins=[app.config["CORS_ORIGIN"]], supports_credentials=True)
@json_error
def post_login():
    credentials = request.get_json(force=True)
    try:
        match = User.query.filter_by(email=credentials["username"]).first()
        if not match:
            raise UnauthorizedError("bad username")
        if not bcrypt.verify(credentials["password"], match.hashed_password):
            raise UnauthorizedError("bad password")
    except UnauthorizedError as unauthorized_error:
        resp = make_response(jsonify({"error": str(unauthorized_error), "status": 401}))
        resp.set_cookie(COOKIE_KEY, "", expires=0)
        resp.status_code = 401
        return resp

    expiry = datetime.utcnow() + timedelta(hours=24)
    encoded = jwt.encode(
        {
            "exp": expiry,
            "priv": {
                "userId": match.user_id,
                "accounts": [a.account_id for a in match.accounts],
            },
        },
        app.config["JWT_PRIVATE_KEY"].encode(),
        algorithm="RS256",
    ).decode()

    resp = make_response(jsonify({"user": match.serialize()}))
    resp.set_cookie(
        COOKIE_KEY,
        encoded,
        httponly=True,
        expires=expiry,
        path="/",
        domain=app.config["COOKIE_DOMAIN"],
        samesite="strict",
    )
    return resp


@app.route("/api/login", methods=["GET"])
@cross_origin(origins=[app.config["CORS_ORIGIN"]], supports_credentials=True)
@json_error
def get_login():
    auth_cookie = request.cookies.get(COOKIE_KEY)
    public_keys = app.config["JWT_PUBLIC_KEYS"]

    token = None
    token_err = None
    for public_key in public_keys:
        try:
            token = jwt.decode(auth_cookie, public_key)
            break
        except Exception as decode_err:
            token_err = decode_err

    if not token:
        return jsonify({"error": str(token_err), "status": 401}), 401

    try:
        match = User.query.get(token["priv"]["userId"])
    except KeyError as key_err:
        return (
            jsonify(
                {"error": "malformed JWT claims: {}".format(key_err), "status": 401}
            ),
            401,
        )
    return jsonify({"user": match.serialize()})


@app.route("/api/logout", methods=["POST"])
@cross_origin(origins=[app.config["CORS_ORIGIN"]], supports_credentials=True)
@json_error
def post_logout():
    resp = make_response("")
    resp.set_cookie(COOKIE_KEY, "", expires=0)
    resp.status_code = 204
    return resp


@app.route("/api/key", methods=["GET"])
@json_error
def key():
    """
    This route is not supposed to be called by client-side applications, so
    no CORS configuration is added
    """
    return jsonify({"keys": app.config["JWT_PUBLIC_KEYS"]})
