"""Unit tests for health check and general routing behavior.

Uses pytest fixtures to verify correct status returns and JSON formats.
"""

import pytest
from flask.testing import FlaskClient
from app import create_app


@pytest.fixture
def client() -> FlaskClient:
    """Fixture that initializes the application factory in testing configuration.

    Yields:
        FlaskClient: An isolated test client instance.
    """
    app = create_app("testing")
    with app.test_client() as client:
        yield client


def test_health_endpoint(client: FlaskClient) -> None:
    """Verifies that the /health endpoint is operational.

    Asserts:
        - HTTP status code is 200.
        - JSON body matches defined fields and schema.
    """
    response = client.get("/health")
    assert response.status_code == 200

    data = response.get_json()
    assert data is not None
    assert data.get("status") == "healthy"
    assert data.get("service") == "candidate-ranking-system"
    assert data.get("version") == "1.0.0"


def test_404_handler(client: FlaskClient) -> None:
    """Verifies that non-existent routes trigger the global 404 handler.

    Asserts:
        - HTTP status code is 404.
        - Body matches the error JSON template.
    """
    response = client.get("/invalid-route-name-path")
    assert response.status_code == 404

    data = response.get_json()
    assert data is not None
    assert data.get("error") == "Not Found"
