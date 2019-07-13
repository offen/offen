import yaml
from passlib.hash import bcrypt

from accounts import db
from accounts.models import Account, User, AccountUserAssociation

if __name__ == "__main__":
    db.drop_all()
    db.create_all()

    with open("./bootstrap.yml", "r") as stream:
        data = yaml.safe_load(stream)

    for account in data["accounts"]:
        record = Account(
            name=account["name"],
            account_id=account["id"],
        )
        db.session.add(record)

    for user in data["users"]:
        record = User(
            email=user["email"],
            hashed_password=bcrypt.hash(user["password"]),
        )
        for account_id in user["accounts"]:
            record.accounts.append(AccountUserAssociation(account_id=account_id))
        db.session.add(record)

    db.session.commit()

    print("Successfully bootstrapped accounts database")
