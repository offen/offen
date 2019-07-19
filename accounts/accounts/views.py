from datetime import datetime, timedelta

import requests
from flask_admin.contrib.sqla import ModelView
from wtforms import PasswordField, StringField, Form
from wtforms.validators import InputRequired, EqualTo
from passlib.hash import bcrypt
import jwt

from accounts import db, app
from accounts.models import AccountUserAssociation


class RemoteServerException(Exception):
    status = 0

    def __str__(self):
        return "Status {}: {}".format(
            self.status, super(RemoteServerException, self).__str__()
        )


def create_remote_account(name, account_id):
    # expires in 30 seconds as this will mean the HTTP request would have
    # timed out anyways
    expiry = datetime.utcnow() + timedelta(seconds=30)
    encoded = jwt.encode(
        {"ok": True, "exp": expiry, "priv": {"rpc": "1"}},
        app.config["JWT_PRIVATE_KEY"].encode(),
        algorithm="RS256",
    ).decode("utf-8")

    r = requests.post(
        "{}/accounts".format(app.config["SERVER_HOST"]),
        json={"name": name, "accountId": account_id},
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
    column_list = ("name", "account_id")

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
    column_list = ("email", "user_id")
    form_columns = ("email", "accounts")
    form_create_rules = ("email", "password", "confirm", "accounts")
    form_edit_rules = ("email", "password", "confirm", "accounts")

    def on_model_change(self, form, model, is_created):
        if form.password.data:
            model.hashed_password = bcrypt.hash(form.password.data)

    def get_create_form(self):
        form = super(UserView, self).get_create_form()
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
        form = super(UserView, self).get_edit_form()
        form.password = PasswordField(
            "Password",
            description="When left blank, the password will remain unchanged on update",
            validators=[EqualTo("confirm", message="Passwords must match")],
        )
        form.confirm = PasswordField("Repeat Password", validators=[])
        return form
