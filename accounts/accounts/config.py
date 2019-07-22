import json
from os import environ


class BaseConfig(object):
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    FLASK_ADMIN_SWATCH = "flatly"


class LocalConfig(BaseConfig):
    SECRET_KEY = environ.get("SESSION_SECRET")
    SQLALCHEMY_DATABASE_URI = environ.get("MYSQL_CONNECTION_STRING")
    CORS_ORIGIN = environ.get("CORS_ORIGIN", "*")
    COOKIE_DOMAIN = environ.get("COOKIE_DOMAIN")
    SERVER_HOST = environ.get("SERVER_HOST")
    def __init__(self):
        with open("private_key.pem") as f:
            private_key = f.read()
        with open("public_key.pem") as f:
            public_key = f.read()
        self.JWT_PRIVATE_KEY = private_key
        self.JWT_PUBLIC_KEYS = [public_key]


class SecretsManagerConfig(BaseConfig):
    CORS_ORIGIN = environ.get("CORS_ORIGIN", "*")
    COOKIE_DOMAIN = environ.get("COOKIE_DOMAIN")
    SERVER_HOST = environ.get("SERVER_HOST")

    def __init__(self):
        import boto3

        session = boto3.session.Session()
        self.client = session.client(
            service_name="secretsmanager", region_name=environ.get("AWS_REGION")
        )

        self.SECRET_KEY = self.get_secret("sessionSecret")
        self.SQLALCHEMY_DATABASE_URI = self.get_secret("mysqlConnectionString")

        current_version = self.get_secret("jwtKeyPair")
        key_pair = json.loads(current_version)
        previous_version = self.get_secret("jwtKeyPair", previous=True)
        previous_key_pair = (
            json.loads(previous_version)
            if previous_version is not None
            else {"public": None}
        )

        self.JWT_PRIVATE_KEY = key_pair["private"]
        self.JWT_PUBLIC_KEYS = [
            k for k in [key_pair["public"], previous_key_pair["public"]] if k
        ]

    def get_secret(self, secret_name, previous=False):
        import base64
        from botocore.exceptions import ClientError

        try:
            ssm_response = self.client.get_secret_value(
                SecretId="{}/accounts/{}".format(environ.get("STAGE"), secret_name),
                VersionStage=("AWSPREVIOUS" if previous else "AWSCURRENT"),
            )
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException" and previous:
                # A secret might not have a previous version yet. It is left
                # up to the caller to handle the None return in this case
                return None
            raise e

        if "SecretString" in ssm_response:
            return ssm_response["SecretString"]
        return base64.b64decode(ssm_response["SecretBinary"])
