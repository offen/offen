help:
	@echo "    up"
	@echo "        Start the development server"
	@echo "    down"
	@echo "        Tear down the development server"
	@echo "    setup"
	@echo "        Build the development containers and install dependencies"
	@echo "    bootstrap"
	@echo "        Set up and seed databases"
	@echo "        **IMPORTANT**: this wipes any existing data in your local database"
	@echo "    update"
	@echo "        Install / update dependencies in the containers"
	@echo "    audit"
	@echo "        Run npm audit for all apps"
	@echo "    migrate"
	@echo "        Apply pending database migrations"
	@echo "    build"
	@echo "        Build binaries and Docker image"
	@echo "    extract-strings"
	@echo "        Extract strings for localization"
	@echo "    secret"
	@echo "        Generate a random base64 encoded secret"

setup: dev-build update howto

dev-build:
	@docker-compose build

howto:
	@echo "Successfully built containers and installed dependencies."
	@echo "If this is your initial setup, you can run 'make bootstrap' next"
	@echo "to create seed the database."

bootstrap:
	@echo "Bootstrapping Server service ..."
	@docker-compose run --rm server make bootstrap

update:
	@echo "Installing / updating dependencies ..."
	@docker-compose run --rm script npm install
	@docker-compose run --rm vault npm install
	@docker-compose run --rm auditorium npm install
	@docker-compose run --rm server go mod download

audit:
	@echo "Auditing npm dependencies ..."
	@docker-compose run --rm script npm audit
	@docker-compose run --rm vault npm audit
	@docker-compose run --rm auditorium npm audit

migrate:
	@docker-compose run --rm server make migrate

extract-strings:
	@docker-compose run --rm server make extract-strings
	@docker-compose run --rm auditorium npm run extract-strings
	@docker-compose run --rm script npm run extract-strings
	@docker-compose run --rm vault npm run extract-strings

DOCKER_IMAGE_TAG ?= local
ROBOTS_FILE ?= robots.txt.staging
BUILD_LINUX ?= '1'
BUILD_WINDOWS ?= ''
BUILD_DARWIN ?= ''

build:
	@docker build --build-arg BUILD_LINUX=${BUILD_LINUX} --build-arg BUILD_WINDOWS=${BUILD_WINDOWS} --build-arg BUILD_DARWIN=${BUILD_DARWIN} --build-arg GIT_REVISION=$(shell git rev-parse --short HEAD) -t offen/build:${DOCKER_IMAGE_TAG} -f build/Dockerfile.build .
	@docker create -it --name binary offen/build:${DOCKER_IMAGE_TAG} bash
	@docker cp binary:/code/server/bin/ .
	@docker rm binary
	@docker build -t offen/offen:${DOCKER_IMAGE_TAG} -f build/Dockerfile .

secret:
	@docker-compose run server make secret

up:
	@docker-compose up

down:
	@docker-compose down

test:
	@docker-compose run --rm script npm test
	@docker-compose run --rm vault npm test
	@docker-compose run --rm auditorium npm test
	@docker-compose run --rm server make test

.PHONY: setup build bootstrap build secret test up down
