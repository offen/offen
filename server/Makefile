test:
	@go test ./... -cover -race

up:
	@go run cmd/server/main.go

install:
	@go mod download

bootstrap: migrate
	@go run cmd/offen/main.go bootstrap

migrate:
	@go run cmd/offen/main.go migrate

secret:
	@go run cmd/offen/main.go secret

test-ci: bootstrap
	@go test ./... -cover -tags="integration"

.PHONY: bootstrap migrate secret
