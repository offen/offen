#! /bin/bash
set -e

locales="${@:1}"

if [ -z "$locales" ]; then
	echo "No locales given. Nothing to do."
	exit 0
fi

for locale in $locales
do
	for f in $(ls public/*.go.html)
	do
		touch locales/$locale.po
		# Heads up: this does **not** match fmt args right now
		sed 's/{{ __ \(".*"\) }}/{{ gettext(\1) }}/g' $f | xgettext --from-code=UTF-8 --join-existing --language=c --output=locales/$locale.po -
	done
	echo "Extracted strings for locale $locale"
done
