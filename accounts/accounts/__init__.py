from os import environ

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin

from accounts.config import EnvConfig

app = Flask(__name__)
app.config.from_object(environ.get("CONFIG_CLASS"))

db = SQLAlchemy(app)

from accounts.models import Account, User
from accounts.views import AccountView, UserView
import accounts.api

admin = Admin(
    app, name="offen admin", template_mode="bootstrap3", base_template="index.html"
)

admin.add_view(AccountView(Account, db.session))
admin.add_view(UserView(User, db.session))
