from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from pymongo.uri_parser import parse_uri
from flask import g
import os
import logging

logger = logging.getLogger(__name__)

DEFAULT_MONGO_URI = "mongodb://localhost:27017/recruiter_agent"
DEFAULT_DB_NAME   = "recruiter_agent"

# Cache connection failures to prevent 21-second DNS blocking on every request
_MONGO_AVAILABLE = True


def _resolve_uri_and_dbname() -> tuple[str, str]:
    """Return (mongo_uri, db_name), always guaranteed non-empty."""
    mongo_uri = os.environ.get("MONGO_URI", DEFAULT_MONGO_URI).strip()
    if not mongo_uri:
        mongo_uri = DEFAULT_MONGO_URI

    try:
        parsed   = parse_uri(mongo_uri)
        db_name  = parsed.get("database") or DEFAULT_DB_NAME
    except Exception:
        db_name = DEFAULT_DB_NAME

    return mongo_uri, db_name


def get_db():
    """Return the MongoDB database, reusing the per-request connection."""
    global _MONGO_AVAILABLE
    if not _MONGO_AVAILABLE:
        return None

    if "db" not in g:
        mongo_uri, db_name = _resolve_uri_and_dbname()

        try:
            client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
            client.admin.command("ping")          # verify connectivity
            g.db_client = client
            g.db        = client[db_name]
            _setup_indices(g.db)
        except Exception as exc:
            logger.error(f"MongoDB connection failed: {exc}")
            _MONGO_AVAILABLE = False
            return None

    return g.db


def close_db(e=None):
    """Close the database connection at the end of the request."""
    db_client = g.pop('db_client', None)

    if db_client is not None:
        db_client.close()

def init_app(app):
    """Register database teardown function with the Flask app."""
    app.teardown_appcontext(close_db)

def _setup_indices(db):
    """Create necessary indices for collections."""
    db.users.create_index("email", unique=True)
    db.jobs.create_index("recruiter_id")
