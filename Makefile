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

.PHONY: setup
setup: # @HELP Build the development containers and install app dependencies
setup: dev-build update
	@echo "Successfully built containers and installed dependencies."
	@echo "If this is your initial setup, you can run 'make bootstrap' next"
	@echo "to create seed the database."

.PHONY: bootstrap
bootstrap: # @HELP Set up and seed databases - **Important**: this deletes any existing data
bootstrap:
	@echo "Bootstrapping Server service ..."
	@docker-compose run --rm server make setup

LOCALE ?= en

.PHONY: up
up: # @HELP Start the development server
up:
	@LOCALE=${LOCALE} docker-compose up

.PHONY: down
down: # @HELP Tear down the development containers
down:
	@docker-compose down

.PHONY: extract-strings
extract-strings: # @HELP Extract user facing strings for localization from source code
extract-strings:
	@docker build -t offen/messages -f build/Dockerfile.messages .
	@docker create --entrypoint=bash -it --name messages offen/messages
	@docker cp messages:/root/locales/ ./
	@docker rm messages

.PHONY: test
test: # @HELP Run unit tests for all subapps
test:
	@docker-compose run --rm script npm test
	@docker-compose run --rm vault npm test
	@docker-compose run --rm auditorium npm test
	@docker-compose run --rm server make test

.PHONY: integration
integration: # @HELP Run integration tests
integration:
	@docker-compose -p offen_integration -f docker-compose.integration.yml run --rm integration npm t

.PHONY: dev-build
dev-build: # @HELP Build the Docker images for local development
dev-build:
	@docker-compose build

.PHONY: update
update: # @HELP Install and/or update dependencies for the subapp containers
update:
	@echo "Installing / updating dependencies ..."
	@docker-compose run --rm script npm install
	@docker-compose run --rm vault npm install
	@docker-compose run --rm auditorium npm install
	@docker-compose run --rm server go mod download -x


.PHONY: migrate
migrate: # @HELP Apply pending migrations to the development database
migrate:
	@docker-compose run --rm server make migrate

.PHONY: secret
secret: # @HELP Create an application secret
secret:
	@docker-compose run server make secret

TARGETS ?= linux/amd64
LDFLAGS ?= -static
OFFEN_GIT_REVISION ?= none

.PHONY: build
build: # @HELP Build the application binary
build:
	@docker build --build-arg ldflags=${LDFLAGS} --build-arg targets=${TARGETS} --build-arg rev=${OFFEN_GIT_REVISION} -t offen/build -f build/Dockerfile.build .
	@mkdir -p bin
	@docker create --entrypoint=bash -it --name binary offen/build
	@docker cp binary:/build/. ./bin
	@docker rm binary

DOCKERFILE ?= Dockerfile
DOCKER_IMAGE_TAG ?= local

.PHONY: build-docker
build-docker: # @HELP Build the docker image
build-docker:
	@docker build -t offen/offen:${DOCKER_IMAGE_TAG} -f build/${DOCKERFILE} .

.PHONY: setup-docs
setup-docs: # @HELP Setup the development environment for working on the docs site
setup-docs:
	@docker-compose -p offen_docs -f docker-compose.docs.yml build
	@docker-compose -p offen_docs -f docker-compose.docs.yml run --rm docs_jekyll gem install bundler
	@docker-compose -p offen_docs -f docker-compose.docs.yml run --rm docs_jekyll bundle install
	@docker-compose -p offen_docs -f docker-compose.docs.yml run --rm docs_jekyll bundle exec just-the-docs rake search:init

.PHONY: docs
docs: # @HELP Run the development environment for the docs site
docs:
	@docker-compose -p offen_docs -f docker-compose.docs.yml up

.PHONY: build-docs
build-docs: # @HELP Build the static asstes for the docs site
build-docs:
	@docker build -t offen/docs -f build/Dockerfile.docs .
	@rm -rf docs-site && mkdir docs-site
	@docker create --entrypoint=bash -it --name assets offen/docs
	@docker cp assets:/repo/_site/. ./docs-site/
	@docker rm assets
