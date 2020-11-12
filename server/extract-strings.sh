#!/bin/bash
# Copyright 2020 - Offen Authors <hioffen@posteo.de>
# SPDX-License-Identifier: Apache-2.0

set -eo pipefail

go run cmd/extract-strings/main.go public/*.go.html \
  | xgettext --omit-header --color=never -o - -c~ --no-location --language=python -
