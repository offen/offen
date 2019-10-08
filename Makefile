help:
	@echo "    setup"
	@echo "        Build the development containers and install dependencies."
	@echo "    update"
	@echo "        Install / update dependencies in the containers."
	@echo "    bootstrap"
	@echo "        Set up and seed databases."
	@echo "        **IMPORTANT**: this wipes any existing data in your local database."
	@echo "    build"
	@echo "        Build the production images."
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
	@docker-compose run server make bootstrap
	@echo ""
	@echo "You can now log into the development backend using the following credentials:"
	@echo ""
	@echo "Email: develop@offen.dev"
	@echo "Password: develop"
	@echo ""

update:
	@echo "Installing / updating dependencies ..."
	@docker-compose run script npm install
	@docker-compose run vault npm install
	@docker-compose run auditorium npm install
	@docker-compose run server go mod download

DOCKER_IMAGE_TAG ?= latest
ROBOTS_FILE ?= robots.txt.staging

build:
	@docker build --build-arg rev=$(shell git rev-parse --short HEAD) -t offen/server:${DOCKER_IMAGE_TAG} -f build/server/Dockerfile .

secret:
	@docker-compose run server make secret

.PHONY: setup build bootstrap build secret
