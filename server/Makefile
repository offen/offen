# Copyright 2020 - Offen Authors <hioffen@posteo.de>
# SPDX-License-Identifier: Apache-2.0

.PHONY: test
test:
	@go test ./... -cover -race

.PHONY: up
up:
	@go run cmd/server/*.go

.PHONY: install
install:
	@go mod download

.PHONY: setup
setup:
	@go run cmd/offen/*.go setup -force -source bootstrap.yml
	@echo ""
	@echo "You can now log into the development backend using the following credentials:"
	@echo ""
	@echo "Email: develop@offen.dev"
	@echo "Password: development"
	@echo ""

.PHONY: migrate
migrate:
	@go run cmd/offen/*.go migrate

.PHONY: secret
secret:
	@go run cmd/offen/*.go secret

