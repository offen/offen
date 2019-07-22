from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend


def create_key_pair(**kwargs):
    key = rsa.generate_private_key(
        backend=default_backend(), public_exponent=65537, **kwargs
    )

    public_key = key.public_key().public_bytes(
        serialization.Encoding.PEM, serialization.PublicFormat.PKCS1
    )

    pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    return {"private": pem.decode(), "public": public_key.decode()}
