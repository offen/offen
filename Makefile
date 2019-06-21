help:
	@echo "    setup"
	@echo "        Build the containers and install dependencies."
	@echo "    bootstrap"
	@echo "        Create a KMS key and initialize the database."
	@echo "        IMPORTANT: this wipes any existing data in your local database."
	@echo "    build"
	@echo "        Build all applications."

setup:
	@docker-compose build
	@docker-compose run script npm install
	@docker-compose run vault npm install
	@docker-compose run auditorium npm install
	@docker-compose run server go mod download
	@docker-compose run kms go mod download
	@echo "Successfully built containers and installed dependencies."
	@echo "If this is your initial setup, you can run 'make bootstrap' next"
	@echo "to create the needed local keys and seed the database."

bootstrap:
	@docker-compose run kms make bootstrap
	@docker-compose run server make bootstrap

.PHONY: setup bootstrap
