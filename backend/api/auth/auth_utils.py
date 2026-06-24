from functools import wraps
from flask import request, jsonify, g
from api.auth.jwt_utils import decode_token

def require_auth(allowed_roles=None):
    """
    Decorator to protect routes and require authentication.
    Optionally restrict access to specific roles.
    """
    if allowed_roles is None:
        allowed_roles = ["user", "recruiter", "admin"]
        
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get("Authorization")
            
            if not auth_header or not auth_header.startswith("Bearer "):
                return jsonify({"error": "Missing or invalid authorization header"}), 401
                
            token = auth_header.split(" ")[1]
            
            try:
                payload = decode_token(token)
                g.user_id = payload.get("sub")
                g.user_role = payload.get("role")
                
                if g.user_role not in allowed_roles:
                    return jsonify({"error": "Forbidden: Insufficient role"}), 403
                    
            except ValueError as e:
                return jsonify({"error": str(e)}), 401
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator
