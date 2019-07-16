import base64
import argparse

from passlib.hash import bcrypt

parser = argparse.ArgumentParser()
parser.add_argument("--password", type=str, help="The password to hash", required=True)
parser.add_argument(
    "--plain",
    help="Do not encode the result as base64",
    default=False,
    action="store_true",
)

if __name__ == "__main__":
    args = parser.parse_args()
    out = bcrypt.hash(args.password)
    if not args.plain:
        out = base64.standard_b64encode(out.encode()).decode()
    print(out)
