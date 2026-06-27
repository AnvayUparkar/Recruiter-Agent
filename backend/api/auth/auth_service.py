from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import re
import os
import requests
import secrets
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

    @staticmethod
    def forgot_password(data: Dict[str, Any]) -> tuple[Dict[str, Any], int]:
        db = get_db()
        if db is None:
            return {"error": "Database connection error"}, 500

        email = data.get("email", "").lower().strip()
        if not email:
            return {"error": "Email is required"}, 400

        users_col = db.users
        user = users_col.find_one({"email": email})

        if not user:
            # For security, do not reveal if the email exists or not.
            return {"message": "If the email is registered, an OTP has been sent."}, 200

        # Generate 6-digit OTP
        otp = "".join([str(secrets.randbelow(10)) for _ in range(6)])
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        users_col.update_one(
            {"_id": user["_id"]},
            {"$set": {"reset_otp": otp, "reset_otp_expires_at": expires_at}}
        )

        # Send email via Brevo
        api_key = os.getenv("BREVO_API_KEY")
        sender_email = os.getenv("BREVO_SENDER_EMAIL", "noreply@recruiteragent.com")

        if api_key:
            try:
                headers = {
                    "accept": "application/json",
                    "api-key": api_key,
                    "content-type": "application/json"
                }
                payload = {
                    "sender": {"name": "Recruiter Agent Support", "email": sender_email},
                    "to": [{"email": email, "name": user.get("full_name", "User")}],
                    "subject": "Password Reset OTP",
                    "htmlContent": f"<html><body><p>Hello,</p><p>Your one-time password (OTP) for password reset is: <strong>{otp}</strong></p><p>This code is valid for 10 minutes.</p></body></html>"
                }
                response = requests.post("https://api.brevo.com/v3/smtp/email", json=payload, headers=headers)
                if response.status_code >= 400:
                    print(f"Failed to send email via Brevo: {response.text}")
                    # You might want to handle this gracefully in production
            except Exception as e:
                print(f"Error sending email: {e}")
        else:
            print(f"WARNING: BREVO_API_KEY not set. OTP for {email} is {otp}")

        return {"message": "If the email is registered, an OTP has been sent."}, 200

    @staticmethod
    def verify_otp(data: Dict[str, Any]) -> tuple[Dict[str, Any], int]:
        db = get_db()
        if db is None:
            return {"error": "Database connection error"}, 500

        email = data.get("email", "").lower().strip()
        otp = data.get("otp", "").strip()

        if not email or not otp:
            return {"error": "Email and OTP are required"}, 400

        users_col = db.users
        user = users_col.find_one({"email": email})

        if not user or "reset_otp" not in user or user["reset_otp"] != otp:
            return {"error": "Invalid OTP"}, 400

        # Check expiration
        expires_at = user.get("reset_otp_expires_at")
        if not expires_at or datetime.now(timezone.utc) > expires_at.replace(tzinfo=timezone.utc):
            return {"error": "OTP has expired"}, 400

        return {"message": "OTP verified successfully"}, 200

    @staticmethod
    def reset_password(data: Dict[str, Any]) -> tuple[Dict[str, Any], int]:
        db = get_db()
        if db is None:
            return {"error": "Database connection error"}, 500

        email = data.get("email", "").lower().strip()
        otp = data.get("otp", "").strip()
        new_password = data.get("password", "")

        if not email or not otp or not new_password:
            return {"error": "Email, OTP, and new password are required"}, 400

        if len(new_password) < 6:
            return {"error": "Password must be at least 6 characters long"}, 400

        users_col = db.users
        user = users_col.find_one({"email": email})

        if not user or "reset_otp" not in user or user["reset_otp"] != otp:
            return {"error": "Invalid OTP"}, 400

        expires_at = user.get("reset_otp_expires_at")
        if not expires_at or datetime.now(timezone.utc) > expires_at.replace(tzinfo=timezone.utc):
            return {"error": "OTP has expired"}, 400

        hashed_pw = hash_password(new_password)

        users_col.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"password_hash": hashed_pw},
                "$unset": {"reset_otp": "", "reset_otp_expires_at": ""}
            }
        )

        return {"message": "Password reset successfully"}, 200
