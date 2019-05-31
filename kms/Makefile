test:
	@go test ./... -cover -race

up:
	@go run cmd/kms/main.go

install:
	@go mod download

test-ci:
	@go test ./... -cover -tags="integration"

bootstrap:
	@go run cmd/bootstrap/main.go

clean-build:
	@rm -rf dist

build: clean-build
	@go build -o dist/kms cmd/kms/main.go
