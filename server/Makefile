test:
	@go test ./... -cover -race

up:
	@go run cmd/server/main.go

install:
	@go mod download

bootstrap: migrate
	@go run cmd/offen/main.go bootstrap -name develop -email develop@offen.dev -password develop -forceid 9b63c4d8-65c0-438c-9d30-cc4b01173393
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

test-ci: bootstrap
	@go test ./... -cover -tags="integration"

.PHONY: bootstrap migrate secret
