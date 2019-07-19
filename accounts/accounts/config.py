from os import environ

class BaseConfig(object):
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    FLASK_ADMIN_SWATCH = "flatly"

class EnvConfig(BaseConfig):
    SECRET_KEY = environ.get("SESSION_SECRET")
    SQLALCHEMY_DATABASE_URI = environ.get("MYSQL_CONNECTION_STRING")
    CORS_ORIGIN = environ.get("CORS_ORIGIN", "*")
    JWT_PRIVATE_KEY = environ.get("JWT_PRIVATE_KEY", "")
    JWT_PUBLIC_KEY = environ.get("JWT_PUBLIC_KEY", "")
    COOKIE_DOMAIN = environ.get("COOKIE_DOMAIN")
    SERVER_HOST = environ.get("SERVER_HOST")
