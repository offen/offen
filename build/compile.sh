#!/bin/sh
# Copyright 2021 - Offen Authors <hioffen@posteo.de>
# SPDX-License-Identifier: Apache-2.0

if [ -z "$LDFLAGS" ]; then
  xgo --targets=$TARGETS --tags 'osusergo netgo static_build sqlite_omit_load_extension' --ldflags="-s -w -X github.com/offen/offen/server/config.Revision=$GIT_REVISION" github.com/offen/offen/server/cmd/offen
else
  xgo --targets=$TARGETS --tags 'osusergo netgo static_build sqlite_omit_load_extension' --ldflags="-linkmode external -extldflags '$LDFLAGS' -s -w -X github.com/offen/offen/server/config.Revision=$GIT_REVISION" github.com/offen/offen/server/cmd/offen
fi
