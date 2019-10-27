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
	@echo "    migrate"
	@echo "        Apply pending database migrations"
	@echo "    build"
	@echo "        Build a local docker image, tagged as offen/offen:local"
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

migrate:
	@docker-compose run server make migrate

DOCKER_IMAGE_TAG ?= local
ROBOTS_FILE ?= robots.txt.staging

build:
	@docker build --build-arg rev=$(shell git rev-parse --short HEAD) -t offen/offen:${DOCKER_IMAGE_TAG} -f build/Dockerfile .
	@docker create -it --name binary offen/offen:local ash
	@docker cp binary:/offen .
	@docker rm binary

secret:
	@docker-compose run server make secret

up:
	@docker-compose up

down:
	@docker-compose down

test:
	@docker-compose run script npm test
	@docker-compose run vault npm test
	@docker-compose run auditorium npm test
	@docker-compose run server make test

.PHONY: setup build bootstrap build secret test up down
