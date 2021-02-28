# Copyright 2020 - Offen Authors <hioffen@posteo.de>
# SPDX-License-Identifier: Apache-2.0

.PHONY: help
help: # @HELP Print this message
help:
	@echo "TARGETS:"
	@grep -E '^.*: *# *@HELP' $(MAKEFILE_LIST)    \
	    | awk '                                   \
	        BEGIN {FS = ": *# *@HELP"};           \
	        { printf "  %-20s %s\n", $$1, $$2 };  \
	    '

.PHONY: test
test: # @HELP Run unit tests
test:
	@go test ./... -cover -race

.PHONY: up
up: # @HELP Run the livereloading development server
up:
	@go run cmd/server/*.go

.PHONY: install
install: # @HELP Install dependencies from go.mod
install:
	@go mod download

.PHONY: setup
setup: # @HELP Run offen setup using the accounts and users defined in bootstrap.yml
setup:
	@go run cmd/offen/*.go setup -force -source bootstrap.yml
	@echo ""
	@echo "You can now log into the development backend using the following credentials:"
	@echo ""
	@echo "Email: develop@offen.dev"
	@echo "Password: development"
	@echo ""

.PHONY: migrate
migrate: # @HELP Apply pending migrations
migrate:
	@go run cmd/offen/*.go migrate

.PHONY: secret
secret: # @HELP Generate a runtime secret
secret:
	@go run cmd/offen/*.go secret

.PHONY: outdated
outdated: # @HELP List dependencies which have an update available
outdated:
	@go list -u -f '{{if (and (not (or .Main .Indirect)) .Update)}}{{.Path}}: {{.Version}} -> {{.Update.Version}}{{end}}' -m all 2> /dev/null
