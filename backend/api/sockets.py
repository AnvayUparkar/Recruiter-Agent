from flask_socketio import SocketIO, emit, join_room, leave_room
import logging
from flask import request

logger = logging.getLogger(__name__)

# Initialize without app, we will call init_app later in app.py
socketio = SocketIO(cors_allowed_origins="*")

@socketio.on("connect")
def handle_connect():
    """Handle new socket connection"""
    # E.g., user connects, we can join them to their personal room based on token or ID passed
    user_id = request.args.get("userId")
    role = request.args.get("role")
    
    if user_id:
        join_room(user_id)
        logger.info(f"User {user_id} ({role}) connected and joined room {user_id}")
        
    if role == "recruiter":
        join_room("recruiters")
        
    emit("connection_success", {"status": "connected"})

@socketio.on("disconnect")
def handle_disconnect():
    """Handle socket disconnect"""
    user_id = request.args.get("userId")
    if user_id:
        logger.info(f"User {user_id} disconnected")

@socketio.on("message_sent")
def handle_message(data):
    """
    data = {
      'conversationId': str,
      'senderId': str,
      'receiverId': str,
      'text': str,
      'timestamp': str
    }
    """
    receiver_id = data.get("receiverId")
    if receiver_id:
        # Emit to receiver's room
        emit("message_received", data, to=receiver_id)

@socketio.on("typing_start")
def handle_typing_start(data):
    receiver_id = data.get("receiverId")
    if receiver_id:
        emit("typing_start", data, to=receiver_id)

@socketio.on("typing_stop")
def handle_typing_stop(data):
    receiver_id = data.get("receiverId")
    if receiver_id:
        emit("typing_stop", data, to=receiver_id)

@socketio.on("seen")
def handle_seen(data):
    sender_id = data.get("senderId")  # who sent the original message
    if sender_id:
        emit("seen", data, to=sender_id)
