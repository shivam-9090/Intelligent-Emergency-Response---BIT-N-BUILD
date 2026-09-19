.PHONY: lint fmt typecheck test check

lint:
	ruff check app tests
	ruff format --check app tests

fmt:
	ruff check --fix app tests
	ruff format app tests

typecheck:
	mypy app

test:
	pytest -q --cov=app --cov-report=term-missing

check: lint typecheck test
