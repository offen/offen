#! /bin/bash
# Copyright 2020 - Offen Authors <hioffen@posteo.de>
# SPDX-License-Identifier: Apache-2.0

set -eo pipefail

locales=$(cat ./locales/LINGUAS)

if [ -z "$locales" ]; then
	echo "No locales configured. Nothing to do."
	exit 0
fi

for locale in $locales
do
	touch locales/$locale.po
	go run cmd/extract-strings/main.go public/*.go.html | xgettext -c~ --no-location --from-code=UTF-8 --language=python --output=locales/$locale-update.po -
	msgmerge "locales/$locale.po" "locales/$locale-update.po" -o "locales/$locale.po"
	rm "locales/$locale-update.po"
	echo "Extracted strings for locale $locale"
done
