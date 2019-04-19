test:
	@go test ./... -cover -race

bootstrap:
	@go run cmd/bootstrap/main.go

test-ci: bootstrap
	@go test ./... -cover -tags="integration"
