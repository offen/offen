
help:
	@echo "    setup"
	@echo "        Build the development containers and install dependencies."
	@echo "    bootstrap"
	@echo "        Set up keys and seed databases."
	@echo "        IMPORTANT: this wipes any existing data in your local database."
	@echo "    build"
	@echo "        Build the production containers."

setup:
	@docker-compose build
	@docker-compose run script npm install
	@docker-compose run vault npm install
	@docker-compose run auditorium npm install
	@docker-compose run server go mod download
	@docker-compose run homepage pip install --user -r requirements.txt
	@echo "Successfully built containers and installed dependencies."
	@echo "If this is your initial setup, you can run 'make bootstrap' next"
	@echo "to create the needed local keys and seed the database."

bootstrap:
	@echo "Bootstrapping Server service ..."
	@docker-compose run server make bootstrap

DOCKER_IMAGE_TAG ?= latest

build:
	@docker build -t offen/server:${DOCKER_IMAGE_TAG} -f build/server/Dockerfile .
	@docker build --build-arg siteurl=${SITEURL} -t offen/proxy:${DOCKER_IMAGE_TAG} -f build/proxy/Dockerfile .

secret:
	@docker-compose run server make secret

.PHONY: setup bootstrap build secret
