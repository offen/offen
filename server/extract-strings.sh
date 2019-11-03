#! /bin/bash
set -e
for locale in de
do
	for f in $(ls public/*.go.html)
	do
		# Heads up: this does **not** match fmt args right now
		sed 's/{{ __ \(".*"\) }}/{{ gettext(\1) }}/g' $f | xgettext --from-code=UTF-8 --join-existing --language=c --output=locales/$locale.po -
	done
	echo "Extracted strings for locale $locale"
done
