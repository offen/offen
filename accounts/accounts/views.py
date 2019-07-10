from datetime import datetime, timedelta
from os import environ

import requests
from flask_admin.contrib.sqla import ModelView
from wtforms import PasswordField, StringField, Form
from wtforms.validators import InputRequired, EqualTo
from passlib.hash import bcrypt
import jwt

from accounts import db
from accounts.models import AccountUserAssociation


class RemoteServerException(Exception):
    status = 0


def create_remote_account(name, account_id):
    private_key = environ.get("JWT_PRIVATE_KEY", "")
    expiry = datetime.utcnow() + timedelta(seconds=10)
    encoded = jwt.encode(
        {"ok": True, "exp": expiry, "priv": {"rpc": "1"}},
        private_key.encode(),
        algorithm="RS256",
    ).decode("utf-8")

    r = requests.post(
        "{}/accounts".format(environ.get("SERVER_HOST")),
        json={"name": name, "account_id": account_id},
        headers={"X-RPC-Authentication": encoded},
    )

    if r.status_code > 299:
        err = r.json()
        remote_err = RemoteServerException(err["error"])
        remote_err.status = err["status"]
        raise remote_err


class AccountForm(Form):
    name = StringField(
        "Account Name",
        validators=[InputRequired()],
        description="This is the account name visible to users",
    )


class AccountView(ModelView):
    form = AccountForm
    column_display_all_relations = True
    column_list = ("account_id", "name")

    def after_model_change(self, form, model, is_created):
        if is_created:
            try:
                create_remote_account(model.name, model.account_id)
            except RemoteServerException as server_error:
                db.session.delete(model)
                db.session.commit()
                raise server_error


class UserView(ModelView):
    inline_models = [(AccountUserAssociation, dict(form_columns=["id", "account"]))]
    column_auto_select_related = True
    column_display_all_relations = True
    column_list = ("user_id", "email")
    form_columns = ("email", "accounts")

    def on_model_change(self, form, model, is_created):
        if form.password.data:
            model.hashed_password = bcrypt.hash(form.password.data)

    def get_create_form(self):
        form = super().get_create_form()
        form.password = PasswordField(
            "Password",
            validators=[
                InputRequired(),
                EqualTo("confirm", message="Passwords must match"),
            ],
        )
        form.confirm = PasswordField("Repeat Password", validators=[InputRequired()])
        return form

    def get_edit_form(self):
        form = super().get_edit_form()
        form.password = PasswordField(
            "Password",
            description="When left blank, the password will remain unchanged on update",
            validators=[
                EqualTo("confirm", message="Passwords must match"),
            ],
        )
        form.confirm = PasswordField("Repeat Password", validators=[])
        return form
