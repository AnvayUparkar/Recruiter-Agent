import jwt
import datetime
from flask import current_app
from config import config_by_name
import os

def _get_secret():
    config_name = os.environ.get("FLASK_ENV", "development")
    config_obj = config_by_name.get(config_name, config_by_name["default"])
    return getattr(config_obj, 'JWT_SECRET', 'super_secret_jwt_key_12345')

def generate_token(user_id: str, role: str, expires_in_hours: int = 24) -> str:
    """Generates a JWT token for a given user id and role."""
    payload = {
        'sub': str(user_id),
        'role': role,
        'iat': datetime.datetime.now(datetime.timezone.utc),
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=expires_in_hours)
    }
    return jwt.encode(payload, _get_secret(), algorithm='HS256')

def decode_token(token: str) -> dict:
    """Decodes a JWT token, verifying its signature and expiration."""
    try:
        payload = jwt.decode(token, _get_secret(), algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")
