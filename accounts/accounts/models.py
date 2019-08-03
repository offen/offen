from uuid import uuid4

from accounts import db


def generate_key():
    return str(uuid4())


class Account(db.Model):
    __tablename__ = "accounts"
    account_id = db.Column(db.String(36), primary_key=True, default=generate_key)
    name = db.Column(db.Text, nullable=False)
    users = db.relationship("AccountUserAssociation", back_populates="account", cascade="delete")

    def __repr__(self):
        return self.name


class User(db.Model):
    __tablename__ = "users"
    user_id = db.Column(db.String(36), primary_key=True, default=generate_key)
    email = db.Column(db.String(128), nullable=False, unique=True)
    hashed_password = db.Column(db.Text, nullable=False)
    accounts = db.relationship(
        "AccountUserAssociation", back_populates="user", lazy="joined"
    )

    def serialize(self):
        associated_accounts = [a.account_id for a in self.accounts]
        records = [
            {"name": a.name, "accountId": a.account_id}
            for a in Account.query.filter(Account.account_id.in_(associated_accounts))
        ]
        return {"userId": self.user_id, "email": self.email, "accounts": records}


class AccountUserAssociation(db.Model):
    __tablename__ = "account_to_user"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.String(36), db.ForeignKey("users.user_id"), nullable=False)
    account_id = db.Column(
        db.String(36), db.ForeignKey("accounts.account_id"), nullable=False
    )

    user = db.relationship("User", back_populates="accounts")
    account = db.relationship("Account", back_populates="users")
