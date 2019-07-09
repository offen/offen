from datetime import datetime, timedelta
from os import environ
import base64

from flask import jsonify, render_template, make_response, request
from flask_cors import cross_origin
from passlib.hash import bcrypt
import jwt

from accounts import app

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/login", methods=["POST"])
@cross_origin(origins=[environ.get("CORS_ORIGIN", "*")], supports_credentials=True)
def post_login():
    credentials = request.get_json(force=True)

    if credentials["username"] != environ.get("USER", "offen"):
        return jsonify({"error": "bad username", "status": 401}), 401

    hashed_password = base64.standard_b64decode(environ.get("HASHED_PASSWORD", ""))
    if not bcrypt.verify(credentials["password"], hashed_password):
        return jsonify({"error": "bad password", "status": 401}), 401

    private_key = environ.get("JWT_PRIVATE_KEY", "")
    expiry = datetime.utcnow() + timedelta(hours=24)
    try:
        encoded = jwt.encode(
            {"ok": True, "exp": expiry}, private_key.encode(), algorithm="RS256"
        ).decode("utf-8")
    except jwt.exceptions.PyJWTError as encode_error:
        return jsonify({"error": str(encode_error), "status": 500}), 500

    resp = make_response(jsonify({"ok": True}))
    resp.set_cookie(
        "auth",
        encoded,
        httponly=True,
        expires=expiry,
        path="/",
        domain=environ.get("COOKIE_DOMAIN"),
        samesite="strict"
    )
    return resp


@app.route("/api/login", methods=["GET"])
@cross_origin(origins=[environ.get("CORS_ORIGIN", "*")], supports_credentials=True)
def get_login():
    auth_cookie = request.cookies.get("auth")
    public_key = environ.get("JWT_PUBLIC_KEY", "")
    try:
        jwt.decode(auth_cookie, public_key)
    except jwt.exceptions.PyJWTError as unauthorized_error:
        return jsonify({"error": str(unauthorized_error), "status": 401}), 401

    return jsonify({"ok": True})


# This route is not supposed to be called by client-side applications, so
# no CORS configuration is added
@app.route("/api/key", methods=["GET"])
def key():
    public_key = environ.get("JWT_PUBLIC_KEY", "").strip()
    return jsonify({"key": public_key})
