test:
	@go test ./... -cover -race

up:
	@go run cmd/server/main.go

install:
	@go mod download

bootstrap: migrate
	@go run cmd/bootstrap/main.go

migrate:
	@go run cmd/migrate/main.go

test-ci: bootstrap
	@go test ./... -cover -tags="integration"

clean-build:
	@rm -rf bin

build: clean-build
	@GOOS=linux go build -o bin/server cmd/lambda/main.go

.PHONY: bootstrap migrate
