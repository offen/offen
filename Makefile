test: test-server

test-server:
	@cd server; go test ./...
