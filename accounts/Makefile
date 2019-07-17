test:
	@pytest --disable-pytest-warnings

test-ci: bootstrap
	@pytest --disable-pytest-warnings

fmt:
	@black .

bootstrap:
	@python -m scripts.bootstrap

.PHONY: test fmt bootstrap
