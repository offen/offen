# Copyright 2020 - Offen Authors <hioffen@posteo.de>
# SPDX-License-Identifier: Apache-2.0

import csv
import argparse

"""
This script is used to automatically generate a NOTICE file from different
csv sources. Right now, input from `npm-license-crawler` [0] (for npm managed
dependencies) and `license_finder` (for Go modules) [1] is supported.

[0]: https://www.npmjs.com/package/npm-license-crawler
[1]: https://github.com/pivotal/LicenseFinder
"""

def normalize_row(row):
    result = {}
    try:
        result["name"] = row["module name"]
    except KeyError:
        result["name"] = row["repository"].rsplit("/", 1)[-1]

    result["licenses"] = row["licenses"]

    result["source"] = (
        row["repository"]
        if row["repository"].startswith("http")
        else "https://{}".format(row["repository"])
    )

    return result


def read_file(filename):
    result = []
    with open(filename, "r") as csv_file:
        csv_reader = csv.DictReader(csv_file)
        for row in csv_reader:
            result.append(normalize_row(row))
    return result


def dedupe(dependencies):
    result = []
    for dep in dependencies:
        if not any(existing["name"] == dep["name"] for existing in result):
            result.append(dep)
    return result


def main(app='Offen', server=[], client=[]):
    client_deps = []
    for source in client:
        client_deps += read_file(source)
    client_deps = dedupe(client_deps)

    server_deps = []
    for source in server:
        server_deps += read_file(source)
    server_deps = dedupe(server_deps)

    print("{} bundles the following 3rd party software:".format(app))
    if client_deps:
        print(
            """
Client side:
============
"""
        )
        for dep in client_deps:
            print(
                '"{}" licensed under {}, available at {}'.format(
                    dep["name"].strip(), dep["licenses"].strip(), dep["source"].strip(),
                )
            )
    if server_deps:
        print(
            """
Server side:
============
        """
        )
        for dep in server_deps:
            print(
                '"{}" licensed under {}, available at {}'.format(
                    dep["name"].strip(), dep["licenses"].strip(), dep["source"].strip(),
                )
            )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a NOTICE file")
    parser.add_argument("--client", dest="client", action="append", default=[])
    parser.add_argument("--server", dest="server", action="append", default=[])
    args = parser.parse_args()
    main(server=args.server, client=args.client)
