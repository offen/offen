test:
	@go test ./... -cover -race

up:
	@go run cmd/server/main.go

install:
	@go mod download

setup:
	@go run cmd/offen/main.go setup -source bootstrap.yml
	@echo ""
	@echo "You can now log into the development backend using the following credentials:"
	@echo ""
	@echo "Email: develop@offen.dev"
	@echo "Password: develop"
	@echo ""

migrate:
	@go run cmd/offen/main.go migrate

secret:
	@go run cmd/offen/main.go secret

test-ci: setup
	@go test ./... -cover -tags="integration"

extract-strings:
	@./extract-strings.sh

.PHONY: bootstrap migrate secret
