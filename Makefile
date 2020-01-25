help:
	@echo "    setup"
	@echo "        Build the development containers and install dependencies."
	@echo "    update"
	@echo "        Install / update dependencies in the development containers."
	@echo "    build"
	@echo "        Build the production assets."
	@echo "    up"
	@echo "        Start the development server."

setup: dev-build update

dev-build:
	@docker-compose build

up:
	@docker-compose up

update:
	@echo "Installing / updating dependencies ..."
	@docker-compose run --rm docs bundle install
	@docker-compose run --rm docs bundle exec just-the-docs rake search:init
	@echo "Successfully built containers and installed dependencies."

build:
	@docker build -t offen/docs -f build/Dockerfile .
	@rm -rf output && mkdir output
	@docker create --entrypoint=bash -it --name assets offen/docs
	@docker cp assets:/repo/_site/. ./output/
	@docker rm assets

.PHONY: setup build up
