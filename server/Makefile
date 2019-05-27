test:
	@go test ./... -cover -race

up:
	@go run cmd/server/main.go

install:
	@go mod download

bootstrap:
	@go run cmd/bootstrap/main.go

test-ci: bootstrap
	@go test ./... -cover -tags="integration"

clean-build:
	@rm -rf dist

build: clean-build
	@go build -o dist/server cmd/server/main.go
