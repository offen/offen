# Copyright 2020 - Offen Authors <hioffen@posteo.de>
# SPDX-License-Identifier: Apache-2.0

import sys
import csv

def read_file(filename):
    result = []
    with open(filename, 'r') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        for row in csv_reader:
            result.append(row)
    return result


def dedupe(dependencies):
    result = []
    for dep in dependencies:
        if not any(existing['module name'] == dep['module name'] for existing in result):
            result.append(dep)
    return result


def main(*sources):
    all_deps = []
    for source in sources:
        all_deps += read_file(source)
    all_deps = dedupe(all_deps)

    print("""Offen bundles the following 3rd party software:
    """)
    for dep in all_deps:
        print(
            "\"{}\" licensed under {}, available at {}".format(
                dep['module name'], dep['licenses'], dep['repository'],
            )
        )


if __name__ == "__main__":
    main(*sys.argv[1:])
