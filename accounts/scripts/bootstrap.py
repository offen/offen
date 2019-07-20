import yaml
from passlib.hash import bcrypt

from lambdas.create_keys import create_key_pair

if __name__ == "__main__":
    keypair = create_key_pair(key_size=2048)
    with open("public_key.pem", "w") as f:
        f.write(keypair["public"])

    with open("private_key.pem", "w") as f:
        f.write(keypair["private"])

    from accounts import db
    from accounts.models import Account, User, AccountUserAssociation

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

    print("Successfully bootstrapped accounts database and created key pair")
