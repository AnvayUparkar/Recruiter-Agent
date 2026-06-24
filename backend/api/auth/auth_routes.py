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
