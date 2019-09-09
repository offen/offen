
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
	@echo "Successfully built containers and installed dependencies."
	@echo "If this is your initial setup, you can run 'make bootstrap' next"
	@echo "to create the needed local keys and seed the database."

bootstrap:
	@echo "Bootstrapping Server service ..."
	@docker-compose run server make bootstrap

build:
	@docker build -t offen/server:latest -f build/server/Dockerfile .
	@docker build -t offen/proxy:latest -f build/proxy/Dockerfile .

secret:
	@docker-compose run server make secret

.PHONY: setup bootstrap build secret
