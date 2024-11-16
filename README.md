Here's a list of the endpoints for your Flask app hosted at `https://claw.rotur.dev`, along with their inputs, format, and a short description:

---

### 1. **Create Post**
**Endpoint:** `https://claw.rotur.dev/post`  
**Method:** GET  
**Inputs:**
- `auth` (required): User authentication key.
- `content` (required): Post content (max 100 characters).
- `attachment` (optional): A valid URL for an attachment (max 500 characters).

**Description:** Creates a new post for the authenticated user.

---

### 2. **Get Feed**
**Endpoint:** `https://claw.rotur.dev/feed`  
**Method:** GET  
**Inputs:**
- `limit` (optional): Maximum number of posts to retrieve (default: 100, max: 100).

**Description:** Retrieves a feed of posts, sorted from newest to oldest.

---

### 3. **Follow User**
**Endpoint:** `https://claw.rotur.dev/follow`  
**Method:** GET  
**Inputs:**
- `auth` (required): User authentication key.
- `username` (required): Username of the user to follow.

**Description:** Follows the specified user if not already following.

---

### 4. **Unfollow User**
**Endpoint:** `https://claw.rotur.dev/unfollow`  
**Method:** GET  
**Inputs:**
- `auth` (required): User authentication key.
- `username` (required): Username of the user to unfollow.

**Description:** Unfollows the specified user if currently following.

---

### 5. **Get Followers**
**Endpoint:** `https://claw.rotur.dev/followers`  
**Method:** GET  
**Inputs:**
- `username` (required): Username to fetch followers for.

**Description:** Retrieves the list of followers for a specific user.

---

### 6. **Get Following**
**Endpoint:** `https://claw.rotur.dev/following`  
**Method:** GET  
**Inputs:**
- `username` (required): Username to fetch followed users for.

**Description:** Retrieves the list of users a specific user is following.

---

### 7. **Get User Profile**
**Endpoint:** `https://claw.rotur.dev/profile`  
**Method:** GET  
**Inputs:**
- `name` (required): Username to fetch the profile for.

**Description:** Retrieves the profile information and posts of a specific user.

---

### 8. **Delete Post**
**Endpoint:** `https://claw.rotur.dev/delete`  
**Method:** GET  
**Inputs:**
- `auth` (required): User authentication key.
- `id` (required): ID of the post to delete.

**Description:** Deletes the specified post if the authenticated user is the creator.

---

### 9. **Rate Post**
**Endpoint:** `https://claw.rotur.dev/rate`  
**Method:** GET  
**Inputs:**
- `auth` (required): User authentication key.
- `id` (required): ID of the post to rate.
- `rating` (required): Either `1` (like) or `0` (unlike).

**Description:** Allows a user to like or unlike a post.

---

### 10. **Get Following Feed**
**Endpoint:** `https://claw.rotur.dev/following_feed`  
**Method:** GET  
**Inputs:**
- `auth` (required): User authentication key.

**Description:** Retrieves posts from users that the authenticated user is following.

--- 

### Notes:
- All responses are returned in JSON format.
- `auth` is required for most actions and ensures only authorized users can perform them.
