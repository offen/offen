import base64
from os import environ

import boto3
from botocore.exceptions import ClientError
from passlib.hash import bcrypt


session = boto3.session.Session()
boto_client = session.client(
    service_name="secretsmanager", region_name=environ.get("AWS_REGION")
)


def get_secret(boto_client, secret_name):
    ssm_response = boto_client.get_secret_value(
        SecretId="{}/accounts/{}".format(environ.get("STAGE"), secret_name)
    )
    if "SecretString" in ssm_response:
        return ssm_response["SecretString"]
    return base64.b64decode(ssm_response["SecretBinary"])


basic_auth_user = get_secret(boto_client, "basicAuthUser")
hashed_basic_auth_password = get_secret(boto_client, "hashedBasicAuthPassword")


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

    if user != basic_auth_user:
        return build_response(api_arn, False)

    if not bcrypt.verify(password, hashed_basic_auth_password):
        return build_response(api_arn, False)

    return build_response(api_arn, True)
