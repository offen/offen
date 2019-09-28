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

clean-build:
	@rm -rf bin

build: clean-build
	@go build -o bin/offen cmd/offen/main.go

.PHONY: bootstrap migrate secret
