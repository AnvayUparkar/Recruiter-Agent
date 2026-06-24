from typing import Dict, Any, Optional
from datetime import datetime, timezone
import re
from api.db import get_db
from api.auth.password_utils import hash_password, verify_password
from api.auth.jwt_utils import generate_token

def is_valid_email(email: str) -> bool:
    regex = r'^\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    return re.fullmatch(regex, email) is not None

class AuthService:
    @staticmethod
    def signup(data: Dict[str, Any]) -> tuple[Dict[str, Any], int]:
        db = get_db()
        if db is None:
            return {"error": "Database connection error"}, 500

        email = data.get("email", "").lower().strip()
        password = data.get("password", "")
        full_name = data.get("full_name", "").strip()
        role = data.get("role", "user").lower()

        if not email or not password or not full_name:
            return {"error": "Missing required fields"}, 400

        if not is_valid_email(email):
            return {"error": "Invalid email format"}, 400

        if len(password) < 6:
            return {"error": "Password must be at least 6 characters long"}, 400

        if role not in ["user", "recruiter"]:
            return {"error": "Invalid role specified"}, 400

        users_col = db.users
        existing_user = users_col.find_one({"email": email})
        if existing_user:
            return {"error": "Email already registered"}, 409

        hashed_pw = hash_password(password)

        new_user = {
            "full_name": full_name,
            "email": email,
            "password_hash": hashed_pw,
            "role": role,
            "profile_picture": data.get("profile_picture", f"https://api.dicebear.com/7.x/avataaars/svg?seed={email}"),
            "phone": data.get("phone", ""),
            "company": data.get("company", ""),
            "is_verified": False,
            "is_active": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc)
        }

        result = users_col.insert_one(new_user)
        user_id = str(result.inserted_id)

        token = generate_token(user_id, role)

        return {
            "access_token": token,
            "user": {
                "id": user_id,
                "full_name": full_name,
                "email": email,
                "role": role,
                "profile_picture": new_user["profile_picture"]
            }
        }, 201

    @staticmethod
    def login(data: Dict[str, Any]) -> tuple[Dict[str, Any], int]:
        db = get_db()
        if db is None:
            return {"error": "Database connection error"}, 500

        email = data.get("email", "").lower().strip()
        password = data.get("password", "")

        if not email or not password:
            return {"error": "Missing email or password"}, 400

        users_col = db.users
        user = users_col.find_one({"email": email})

        if not user or not verify_password(password, user["password_hash"]):
            return {"error": "Invalid credentials"}, 401

        if not user.get("is_active", True):
            return {"error": "Account is disabled"}, 403

        user_id = str(user["_id"])
        role = user.get("role", "user")

        # Update last login
        users_col.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )

        token = generate_token(user_id, role)

        return {
            "access_token": token,
            "user": {
                "id": user_id,
                "full_name": user.get("full_name"),
                "email": user.get("email"),
                "role": role,
                "profile_picture": user.get("profile_picture")
            }
        }, 200
