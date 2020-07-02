# Copyright 2020 - Offen Authors <hioffen@posteo.de>
# SPDX-License-Identifier: Apache-2.0

import sys
import csv

def normalize_row(row):
    result = {}
    try:
        result['name'] = row['module name']
    except KeyError:
        result['name'] = row['repository']

    result['licenses'] = row['licenses']
    result['source'] = row['repository']

    return result


def read_file(filename):
    result = []
    with open(filename, 'r') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        for row in csv_reader:
            result.append(normalize_row(row))
    return result


def dedupe(dependencies):
    result = []
    for dep in dependencies:
        if not any(existing['name'] == dep['name'] for existing in result):
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
                dep['name'], dep['licenses'], dep['source'],
            )
        )


if __name__ == "__main__":
    main(*sys.argv[1:])
