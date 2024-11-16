import json
import os
import secrets
import time
from flask import Flask, request, jsonify

app = Flask(__name__)

# File paths
USERS_FILE_PATH = "/Users/mist/Documents/APIS/Files/users.json"
LOCAL_POSTS_PATH = "/Users/mist/Documents/APIS/Files/posts.json"
FOLLOWERS_FILE_PATH = "/Users/mist/Documents/APIS/Files/clawusers.json"

from flask import make_response

# Add this function to allow CORS
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'  # Allows all origins, change * to a specific domain if needed
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, DELETE, PUT, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.after_request
def apply_cors(response):
    return add_cors_headers(response)

# Load users from the file
def load_users():
    if os.path.exists(USERS_FILE_PATH):
        with open(USERS_FILE_PATH, 'r') as file:
            return json.load(file)
    return []

users = load_users()

# Load followers data
def load_followers():
    if os.path.exists(FOLLOWERS_FILE_PATH):
        with open(FOLLOWERS_FILE_PATH, 'r') as file:
            return json.load(file)
    return {}

followers_data = load_followers()

# Save followers data
def save_followers():
    with open(FOLLOWERS_FILE_PATH, 'w') as file:
        json.dump(followers_data, file, indent=2)

# Load posts from the local file
def load_posts():
    if os.path.exists(LOCAL_POSTS_PATH):
        with open(LOCAL_POSTS_PATH, 'r') as file:
            return json.load(file)
    else:
        return []

posts = load_posts()

# Save posts locally
def save_posts_local():
    with open(LOCAL_POSTS_PATH, 'w') as file:
        json.dump(posts, file, indent=2)

# Authentication based on the 'key' from users.json
def authenticate_with_key(key):
    user = next((user for user in users if user.get("key") == key), None)
    return user

@app.route('/post', methods=['GET'])
def create_post():
    auth_key = request.args.get("auth")
    if not auth_key:
        return jsonify({"error": "auth key is required"}), 403

    user = authenticate_with_key(auth_key)
    if not user:
        return jsonify({"error": "Invalid authentication key"}), 403

    content = request.args.get('content')
    if not content:
        return jsonify({"error": "Content is required"}), 400

    # Check content length
    if len(content) > 100:
        return jsonify({"error": "Content exceeds 100 character limit"}), 400

    # Get attachment if available
    attachment = request.args.get('attachment')
    if attachment:
        # Ensure it's a URL and not a data URI, and ensure it is under 500 characters
        if len(attachment) > 500:
            return jsonify({"error": "Attachment URL exceeds 500 character limit"}), 400
        if not attachment.startswith("https://"):
            return jsonify({"error": "Attachment must be a valid image URL, not a data URI"}), 400
    
    # Generate a unique ID using secrets
    new_post = {
        "id": secrets.token_hex(16),  # Unique ID for each post
        "content": content,
        "user": user["username"],  # User who posted
        "pfp": user["pfp"],
        "timestamp": round(time.time() * 1000),  # Current timestamp
        "attachment": attachment if attachment else None  # Include attachment if available
    }
    posts.append(new_post)
    save_posts_local()  # Save posts locally after creation
    return jsonify(new_post), 201

@app.route('/feed', methods=['GET'])
def get_feed():
    limit = request.args.get('limit', 100, type=int)
    if limit > 100:
        limit = 100
    return jsonify(posts[-limit:][::-1]), 200


@app.route('/follow', methods=['GET'])
def follow_user():
    auth_key = request.args.get("auth")
    if not auth_key:
        return jsonify({"error": "auth key is required"}), 403

    user = authenticate_with_key(auth_key)
    if not user:
        return jsonify({"error": "Invalid authentication key"}), 403

    target_username = request.args.get("username")
    if not target_username:
        return jsonify({"error": "Target username is required"}), 400

    # Check if the target user exists
    target_user = next((u for u in users if u["username"].lower() == target_username.lower()), None)
    if not target_user:
        return jsonify({"error": "User not found"}), 404

    username = user["username"]

    # Ensure target user has an entry in followers data
    if target_username not in followers_data:
        followers_data[target_username] = {"followers": []}

    # Add the user to the target's followers list
    if username not in followers_data[target_username]["followers"]:
        followers_data[target_username]["followers"].append(username)
        save_followers()
        return jsonify({"message": f"You are now following {target_username}"}), 200

    return jsonify({"error": f"You are already following {target_username}"}), 400

@app.route('/unfollow', methods=['GET'])
def unfollow_user():
    auth_key = request.args.get("auth")
    if not auth_key:
        return jsonify({"error": "auth key is required"}), 403

    user = authenticate_with_key(auth_key)
    if not user:
        return jsonify({"error": "Invalid authentication key"}), 403

    target_username = request.args.get("username")
    if not target_username:
        return jsonify({"error": "Target username is required"}), 400

    username = user["username"]

    # Check if the target user has an entry in followers data
    if target_username in followers_data and username in followers_data[target_username]["followers"]:
        followers_data[target_username]["followers"].remove(username)
        save_followers()
        return jsonify({"message": f"You have unfollowed {target_username}"}), 200

    return jsonify({"error": f"You are not following {target_username}"}), 400

@app.route('/followers', methods=['GET'])
def get_followers():
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Username is required"}), 400

    # Check if the user has an entry in followers data
    if username in followers_data:
        return jsonify({"followers": followers_data[username]["followers"]}), 200

    return jsonify({"followers": []}), 200

@app.route('/following', methods=['GET'])
def get_following():
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Username is required"}), 400

    # Find users followed by the given username
    following = [
        target for target, data in followers_data.items()
        if username in data["followers"]
    ]
    return jsonify({"following": following}), 200

@app.route('/profile', methods=['GET'])
def get_profile():
    name = request.args.get('name')
    if not name:
        return jsonify({"error": "Name is required"}), 400

    # Convert the name to lowercase for case-insensitive comparison
    name_lower = name.lower()

    # Find user with case-insensitive matching
    user = next((user for user in users if user["username"].lower() == name_lower), None)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Fetch user's posts
    user_posts = [post for post in posts if post.get("user").lower() == name_lower]

    # Get follower count
    followers_count = len(followers_data.get(user["username"], {}).get("followers", []))

    # Return limited user data
    profile_data = {
        "username": user["username"],
        "pfp": user.get("pfp"),
        "created": user.get("created"),
        "theme": user.get("theme"),
        "followers": followers_count,  # Number of followers
        "posts": user_posts[::-1]  # Reverse order of posts for latest first
    }
    return jsonify(profile_data), 200


@app.route('/delete', methods=['GET'])
def delete_post():
    auth_key = request.args.get("auth")
    if not auth_key:
        return jsonify({"error": "auth key is required"}), 403

    user = authenticate_with_key(auth_key)
    if not user:
        return jsonify({"error": "Invalid authentication key"}), 403

    post_id = request.args.get('id')
    if not post_id:
        return jsonify({"error": "Post ID is required"}), 400

    global posts
    post_to_delete = next((post for post in posts if post["id"] == post_id), None)
    if not post_to_delete:
        return jsonify({"error": "Post not found"}), 404

    posts = [post for post in posts if post["id"] != post_id]
    save_posts_local()  # Save posts locally after deletion
    return jsonify({"message": "Post deleted successfully"}), 200

@app.route('/rate', methods=['GET'])
def rate_post():
    auth_key = request.args.get("auth")
    if not auth_key:
        return jsonify({"error": "auth key is required"}), 403

    user = authenticate_with_key(auth_key)
    if not user:
        return jsonify({"error": "Invalid authentication key"}), 403

    post_id = request.args.get("id")
    if not post_id:
        return jsonify({"error": "Post ID is required"}), 400

    rating = request.args.get("rating", type=int)
    if rating not in [0, 1]:
        return jsonify({"error": "Rating must be 1 (like) or 0 (unlike)"}), 400

    # Find the post by ID
    post = next((post for post in posts if post["id"] == post_id), None)
    if not post:
        return jsonify({"error": "Post not found"}), 404

    # Ensure the 'likes' key exists
    if "likes" not in post:
        post["likes"] = []

    username = user["username"].lower()

    # Like or unlike based on the rating
    if rating == 1:
        if username not in post["likes"]:
            post["likes"].append(username)
    else:
        if username in post["likes"]:
            post["likes"].remove(username)

    save_posts_local()  # Save posts locally after updating likes
    return jsonify({"message": "Post rated successfully", "likes": post["likes"]}), 200

@app.route('/following_feed', methods=['GET'])
def get_following_feed():
    auth_key = request.args.get("auth")
    if not auth_key:
        return jsonify({"error": "auth key is required"}), 403

    user = authenticate_with_key(auth_key)
    if not user:
        return jsonify({"error": "Invalid authentication key"}), 403

    username = user["username"]

    # Get the list of users the authenticated user is following
    following = [
        target for target, data in followers_data.items()
        if username in data["followers"]
    ]

    # Fetch posts from the followed users
    following_posts = [post for post in posts if post["user"] in following]

    return jsonify(following_posts), 200


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5602)
