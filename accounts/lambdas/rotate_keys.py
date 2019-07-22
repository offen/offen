import io
import boto3
import logging
import json
from os import environ

from lambdas.create_keys import create_key_pair

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def handler(event, context):
    arn = event["SecretId"]
    token = event["ClientRequestToken"]
    step = event["Step"]

    session = boto3.session.Session()
    service_client = session.client(
        service_name="secretsmanager", region_name=environ.get("AWS_REGION")
    )

    # Make sure the version is staged correctly
    metadata = service_client.describe_secret(SecretId=arn)
    if not metadata["RotationEnabled"]:
        logger.error("Secret %s is not enabled for rotation" % arn)
        raise ValueError("Secret %s is not enabled for rotation" % arn)
    versions = metadata["VersionIdsToStages"]
    if token not in versions:
        logger.error(
            "Secret version %s has no stage for rotation of secret %s.", token, arn
        )
        raise ValueError(
            "Secret version %s has no stage for rotation of secret %s." % (token, arn)
        )
    if "AWSCURRENT" in versions[token]:
        logger.info(
            "Secret version %s already set as AWSCURRENT for secret %s.", token, arn
        )
        return
    elif "AWSPENDING" not in versions[token]:
        logger.error(
            "Secret version %s not set as AWSPENDING for rotation of secret %s.",
            token,
            arn,
        )
        raise ValueError(
            "Secret version %s not set as AWSPENDING for rotation of secret %s."
            % (token, arn)
        )

    if step == "createSecret":
        create_secret(service_client, arn, token)

    elif step == "setSecret":
        set_secret(service_client, arn, token)

    elif step == "testSecret":
        test_secret(service_client, arn, token)

    elif step == "finishSecret":
        finish_secret(service_client, arn, token)

    else:
        raise ValueError("Invalid step parameter")


def create_secret(service_client, arn, token):
    service_client.get_secret_value(SecretId=arn, VersionStage="AWSCURRENT")
    try:
        service_client.get_secret_value(
            SecretId=arn, VersionId=token, VersionStage="AWSPENDING"
        )
        logger.info("createSecret: Successfully retrieved secret for %s." % arn)
    except service_client.exceptions.ResourceNotFoundException:
        secret = create_key_pair(key_size=2048)
        service_client.put_secret_value(
            SecretId=arn,
            ClientRequestToken=token,
            SecretString=json.dumps(secret).encode().decode("unicode_escape"),
            VersionStages=["AWSPENDING"],
        )
        logger.info(
            "createSecret: Successfully put secret for ARN %s and version %s."
            % (arn, token)
        )


def set_secret(service_client, arn, token):
    pass


def test_secret(service_client, arn, token):
    pass


def finish_secret(service_client, arn, token):
    metadata = service_client.describe_secret(SecretId=arn)
    current_version = None
    for version in metadata["VersionIdsToStages"]:
        if "AWSCURRENT" in metadata["VersionIdsToStages"][version]:
            if version == token:
                # The correct version is already marked as current, return
                logger.info(
                    "finishSecret: Version %s already marked as AWSCURRENT for %s",
                    version,
                    arn,
                )
                return
            current_version = version
            break

    # Finalize by staging the secret version current
    service_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage="AWSCURRENT",
        MoveToVersionId=token,
        RemoveFromVersionId=current_version,
    )
    logger.info(
        "finishSecret: Successfully set AWSCURRENT stage to version %s for secret %s."
        % (token, arn)
    )
