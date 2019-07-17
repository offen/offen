import base64
from os import environ

from passlib.hash import bcrypt


def build_api_arn(method_arn):
    arn_chunks = method_arn.split(":")
    aws_region = arn_chunks[3]
    aws_account_id = arn_chunks[4]

    gateway_arn_chunks = arn_chunks[5].split("/")
    rest_api_id = gateway_arn_chunks[0]
    stage = gateway_arn_chunks[1]

    return "arn:aws:execute-api:{}:{}:{}/{}/*/*".format(
        aws_region, aws_account_id, rest_api_id, stage
    )


def build_response(api_arn, allow):
    effect = "Deny"
    if allow:
        effect = "Allow"

    return {
        "principalId": "offen",
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": ["execute-api:Invoke"],
                    "Effect": effect,
                    "Resource": [api_arn],
                }
            ],
        },
    }


def handler(event, context):
    api_arn = build_api_arn(event["methodArn"])

    encoded_auth = event["authorizationToken"].lstrip("Basic ")
    auth_string = base64.standard_b64decode(encoded_auth).decode()
    if not auth_string:
        return build_response(api_arn, False)

    credentials = auth_string.split(":")
    user = credentials[0]
    password = credentials[1]

    if user != environ.get("BASIC_AUTH_USER"):
        return build_response(api_arn, False)

    hashed_password = environ.get("HASHED_BASIC_AUTH_PASSWORD")
    if not bcrypt.verify(password, hashed_password):
        return build_response(api_arn, False)

    return build_response(api_arn, True)
