test:
	@go test ./... -cover -race

up:
	@go run cmd/kms/main.go

install:
	@go mod download

test-ci:
	@go test ./... -cover -tags="integration"

bootstrap:
	@go run cmd/bootstrap/main.go -out key.txt

clean-build:
	@rm -rf bin

build: clean-build
	@GOOS=linux go build -o bin/kms cmd/lambda/main.go
