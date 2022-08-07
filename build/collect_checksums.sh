#!/bin/sh
# Copyright 2022 - Offen Authors <hioffen@posteo.de>
# SPDX-License-Identifier: Apache-2.0

for version in "$@"
do
    docker run -e OFFEN_APP_LOCALE=${OFFEN_APP_LOCALE:-en} -d -p 9999:9999 --rm --name offen_checksum offen/offen:$version demo -users 0 -port 9999 > /dev/null
    while [ "$(curl -s -o /dev/null -w ''%{http_code}'' localhost:9999/script.js)" != "200" ]; do
      sleep 2
    done
    curl -sSL localhost:9999/script.js | sha256sum
    docker stop offen_checksum > /dev/null
done
