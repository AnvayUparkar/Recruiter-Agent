from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone
import uuid
import logging
from api.db import get_db
from api.auth.auth_utils import require_auth
from bson.objectid import ObjectId

logger = logging.getLogger(__name__)

chat_bp = Blueprint("chat_routes", __name__)

@chat_bp.route("/conversations", methods=["GET"])
@require_auth()
def get_conversations():
    """
    Get all conversations for the current user.
    If recruiter, fetch where recruiterId == user['id']
    If candidate, fetch where candidateId == user['id']
    """
    db = get_db()
    user_id = g.user_id
    role = g.user_role
    
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
        
    query = {}
    if role == "user":
        query["candidateId"] = user_id
    else:
        query["recruiterId"] = user_id
        
    conversations_cursor = db.conversations.find(query).sort("lastUpdated", -1)
    conversations = list(conversations_cursor)
    
    # Convert ObjectIds to strings and fetch participant details
    for conv in conversations:
        conv["_id"] = str(conv["_id"])
        
        other_id = conv.get("recruiterId") if role == "user" else conv.get("candidateId")
        other_user = None
        
        if other_id:
            try:
                query_id = ObjectId(other_id)
            except Exception:
                query_id = other_id
                
            other_user = db.users.find_one({"_id": query_id}, {"full_name": 1, "profile_picture": 1, "role": 1})
            
        if other_user:
            conv["participantName"] = other_user.get("full_name", "Unknown")
            conv["participantPicture"] = other_user.get("profile_picture", "")
            conv["participantRole"] = other_user.get("role", "User")
        else:
            conv["participantName"] = "Unknown"
            conv["participantPicture"] = ""
            conv["participantRole"] = "Unknown"
        
    return jsonify({"conversations": conversations}), 200

@chat_bp.route("/messages/<conversation_id>", methods=["GET"])
@require_auth()
def get_messages(conversation_id):
    """
    Get messages for a specific conversation.
    Verifies that the user is part of the conversation.
    """
    db = get_db()
    user_id = g.user_id
    
    # Verify access
    conv = db.conversations.find_one({"id": conversation_id})
    if not conv:
        # Fallback to check if it's stored under string _id or similar.
        conv = db.conversations.find_one({"conversationId": conversation_id})
        
    if not conv:
        return jsonify({"error": "Conversation not found"}), 404
        
    if conv.get("candidateId") != user_id and conv.get("recruiterId") != user_id:
        return jsonify({"error": "Access denied"}), 403
        
    messages_cursor = db.messages.find({"conversationId": conversation_id}).sort("timestamp", 1)
    messages = list(messages_cursor)
    
    for msg in messages:
        msg["_id"] = str(msg["_id"])
        
    return jsonify({"messages": messages}), 200

@chat_bp.route("/send", methods=["POST"])
@require_auth()
def send_message():
    """
    Save a new message to the database and update the conversation.
    Note: The actual real-time delivery is handled by Socket.IO directly in some architectures,
    but we can also provide a REST endpoint for sending if needed, which then emits the event.
    """
    db = get_db()
    data = request.json
    
    conversation_id = data.get("conversationId")
    sender_id = g.user_id
    receiver_id = data.get("receiverId")
    text = data.get("text")
    
    if not all([conversation_id, receiver_id, text]):
        return jsonify({"error": "Missing required fields"}), 400
        
    now = datetime.now(timezone.utc).isoformat()
    
    message = {
        "messageId": str(uuid.uuid4()),
        "conversationId": conversation_id,
        "senderId": sender_id,
        "receiverId": receiver_id,
        "text": text,
        "timestamp": now,
        "seen": False
    }
    
    res = db.messages.insert_one(message.copy())
    message["_id"] = str(res.inserted_id)
    
    # Upsert conversation
    role = g.user_role
    candidate_id = sender_id if role == "user" else receiver_id
    recruiter_id = sender_id if role != "user" else receiver_id
    
    db.conversations.update_one(
        {"conversationId": conversation_id},
        {"$set": {
            "conversationId": conversation_id,
            "candidateId": candidate_id,
            "recruiterId": recruiter_id,
            "lastMessage": text,
            "lastUpdated": now
        }},
        upsert=True
    )
    
    # Emit socket event
    from api.sockets import socketio
    socketio.emit("message_received", message, to=receiver_id)
    
    return jsonify({"message": message}), 201
