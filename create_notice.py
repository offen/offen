# Copyright 2020 - Offen Authors <hioffen@posteo.de>
# SPDX-License-Identifier: Apache-2.0

import csv
import argparse
import re

"""
This script is used to automatically generate a NOTICE file from different
csv sources. Right now, input from `npm-license-crawler` [0] (for npm managed
dependencies) and `license_finder` (for Go modules) [1] is supported.

[0]: https://www.npmjs.com/package/npm-license-crawler
[1]: https://github.com/pivotal/LicenseFinder
"""


def normalize_row(row):
    is_versioned_go_module = re.compile(r".*v\d$")
    result = {}
    try:
        result["name"] = row["module name"]
    except KeyError:
        repository = row["repository"]
        chunks = repository.split("/")
        if is_versioned_go_module.match(repository):
            result["name"] = chunks[-2:-1][0]
        else:
            result["name"] = chunks[-1]

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


def main(**kwargs):
    for key, values in kwargs.items():
        deps = []
        for source in values:
            deps += read_file(source)
        deps = dedupe(deps)

        if deps:
            print("\n{} side:\n=========\n".format(key.title()))
            for dep in deps:
                print(
                    '"{}" licensed under {}, available at {}'.format(
                        dep["name"].strip(), dep["licenses"].strip(), dep["source"].strip(),
                    )
                )

    print(
        """
This file is generated automatically and - even though we try to prevent it - may
contain errors and mistakes. If you found any, send us an email
at hioffen@posteo.de containing details about what is incorrect or missing."""
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a NOTICE file")
    parser.add_argument("--client", dest="client", action="append", default=[])
    parser.add_argument("--server", dest="server", action="append", default=[])
    args = parser.parse_args()
    main(client=args.client, server=args.server)
