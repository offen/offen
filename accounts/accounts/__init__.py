from os import environ

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin
from werkzeug.utils import import_string


app = Flask(__name__)

cfg = import_string(environ.get("CONFIG_CLASS"))()
app.config.from_object(cfg)

db = SQLAlchemy(app)

from accounts.models import Account, User
from accounts.views import AccountView, UserView
import accounts.api

admin = Admin(
    app, name="offen admin", template_mode="bootstrap3", base_template="index.html"
)

admin.add_view(AccountView(Account, db.session))
admin.add_view(UserView(User, db.session))
