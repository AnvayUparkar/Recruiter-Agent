from flask import Blueprint, request, jsonify
from api.auth.auth_service import AuthService

auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    result, status = AuthService.signup(data)
    return jsonify(result), status

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    result, status = AuthService.login(data)
    return jsonify(result), status

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    result, status = AuthService.forgot_password(data)
    return jsonify(result), status

@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json() or {}
    result, status = AuthService.verify_otp(data)
    return jsonify(result), status

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    result, status = AuthService.reset_password(data)
    return jsonify(result), status
