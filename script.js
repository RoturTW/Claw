// Global variables
const API_BASE_URL = 'https://claw.rotur.dev';
const AUTH_URL = 'https://rotur.dev/auth';
let authKey = localStorage.getItem('authKey') || '';

// DOM Elements
const authPreSection = document.getElementById('auth-pre');
const authPostSection = document.getElementById('auth-post');
const authButton = document.getElementById('auth-button');
const authTokenDisplay = document.getElementById('auth-token');
const logoutButton = document.getElementById('logout-button');
const authenticatedContent = document.getElementById('authenticated-content');
const postContentInput = document.getElementById('post-content');
const postAttachmentInput = document.getElementById('post-attachment');
const createPostBtn = document.getElementById('create-post');
const usernameSearchInput = document.getElementById('username-search');
const searchProfileBtn = document.getElementById('search-profile');
const loadFeedBtn = document.getElementById('load-feed');
const loadFollowingFeedBtn = document.getElementById('load-following-feed');
const feedContent = document.getElementById('feed-content');
const profileInfo = document.getElementById('profile-info');
const profilePosts = document.getElementById('profile-posts');
const followUsernameInput = document.getElementById('follow-username');
const followBtn = document.getElementById('follow-btn');
const unfollowBtn = document.getElementById('unfollow-btn');
const listUsernameInput = document.getElementById('list-username');
const getFollowersBtn = document.getElementById('get-followers');
const getFollowingBtn = document.getElementById('get-following');
const followList = document.getElementById('follow-list');
const themeToggle = document.getElementById('theme-toggle');
const navMenu = document.getElementById('nav-menu');

// Navigation elements
const navFeed = document.getElementById('nav-feed');
const navProfile = document.getElementById('nav-profile');
const navFollowing = document.getElementById('nav-following');

// Sections
const sections = {
    auth: document.getElementById('auth-section'),
    post: document.getElementById('post-section'),
    search: document.getElementById('search-section'),
    feed: document.getElementById('feed-section'),
    profile: document.getElementById('profile-section'),
    following: document.getElementById('following-section')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    initAuth();
});

// Initialize authentication
function initAuth() {
    // Check for auth callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        // Remove the token from URL (for security)
        const cleanUrl = window.location.href.split('?')[0];
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Save the token
        authKey = token;
        localStorage.setItem('authKey', authKey);
        showAuthenticatedState();
        showNotification('Authentication successful!');
    } else if (authKey) {
        showAuthenticatedState();
    } else {
        showUnauthenticatedState();
    }
}

function showAuthenticatedState() {
    // Show the authenticated content
    authenticatedContent.classList.remove('hidden');
    authPreSection.classList.add('hidden');
    authPostSection.classList.remove('hidden');
    authTokenDisplay.textContent = authKey;
    
    // Show the navigation menu
    navMenu.style.display = 'block';
    
    // Show feed by default
    showSection('feed');
    loadFeed();
}

function showUnauthenticatedState() {
    // Hide the authenticated content
    authenticatedContent.classList.add('hidden');
    authPreSection.classList.remove('hidden');
    authPostSection.classList.add('hidden');
    
    // Hide the navigation menu until authenticated
    navMenu.style.display = 'none';
}

// Setup event listeners
function setupEventListeners() {
    // Auth
    authButton.addEventListener('click', handleAuth);
    logoutButton.addEventListener('click', handleLogout);
    
    // Post creation
    createPostBtn.addEventListener('click', createPost);
    
    // Profile search
    searchProfileBtn.addEventListener('click', searchProfile);
    
    // Feed loading
    loadFeedBtn.addEventListener('click', loadFeed);
    loadFollowingFeedBtn.addEventListener('click', loadFollowingFeed);
    
    // Following/Unfollowing
    followBtn.addEventListener('click', followUser);
    unfollowBtn.addEventListener('click', unfollowUser);
    
    // Get followers/following
    getFollowersBtn.addEventListener('click', getFollowers);
    getFollowingBtn.addEventListener('click', getFollowing);
    
    // Navigation
    navFeed.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('feed');
        loadFeed();
    });
    
    navProfile.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('profile');
    });
    
    navFollowing.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('following');
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
}

// Show/hide sections
function showSection(sectionName) {
    if (!authKey) {
        return; // Don't show any sections if not authenticated
    }
    
    Object.keys(sections).forEach(key => {
        const section = sections[key];
        if (!section) return;
        
        if (key === sectionName) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
}

// Auth functions
function handleAuth() {
    // Open the auth window
    window.location.href = AUTH_URL;
}

function handleLogout() {
    // Clear auth data
    authKey = '';
    localStorage.removeItem('authKey');
    showUnauthenticatedState();
    showNotification('Logged out successfully');
}

// API functions
async function fetchAPI(endpoint, params = {}) {
    const url = new URL(`${API_BASE_URL}/${endpoint}`);
    
    // Add params to URL
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            url.searchParams.append(key, params[key]);
        }
    });
    
    try {
        showLoadingIndicator(true);
        const response = await fetch(url);
        showLoadingIndicator(false);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        showLoadingIndicator(false);
        showNotification(`Error: ${error.message}`, 'error');
        console.error('API error:', error);
        return null;
    }
}

// Loading indicator
function showLoadingIndicator(show) {
    const existingIndicator = document.querySelector('.global-loading');
    
    if (show) {
        if (!existingIndicator) {
            const indicator = document.createElement('div');
            indicator.className = 'global-loading';
            indicator.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(indicator);
        }
    } else {
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }
}

// Create a new post
async function createPost() {
    const content = postContentInput.value.trim();
    const attachment = postAttachmentInput.value.trim();
    
    if (!authKey) {
        showNotification('Please authenticate first', 'error');
        return;
    }
    
    if (!content) {
        showNotification('Please enter post content', 'error');
        return;
    }
    
    if (content.length > 100) {
        showNotification('Post content is too long (max 100 characters)', 'error');
        return;
    }
    
    if (attachment && attachment.length > 500) {
        showNotification('Attachment URL is too long (max 500 characters)', 'error');
        return;
    }
    
    const params = {
        auth: authKey,
        content: content,
        attachment: attachment || undefined
    };
    
    const result = await fetchAPI('post', params);
    
    if (result && result.success) {
        showNotification('Post created successfully!');
        postContentInput.value = '';
        postAttachmentInput.value = '';
        loadFeed();
    }
}

// Load the main feed
async function loadFeed() {
    if (!authKey) {
        showNotification('Please authenticate first', 'error');
        return;
    }
    
    feedContent.innerHTML = '<div class="loading">Loading feed...</div>';
    
    const result = await fetchAPI('feed', { limit: 100 });
    
    if (result && result.posts) {
        renderPosts(result.posts, feedContent);
    } else {
        feedContent.innerHTML = '<div class="no-content">Failed to load feed. Please try again.</div>';
    }
}

// Load the following feed
async function loadFollowingFeed() {
    if (!authKey) {
        showNotification('Please authenticate first', 'error');
        return;
    }
    
    feedContent.innerHTML = '<div class="loading">Loading following feed...</div>';
    
    const result = await fetchAPI('following_feed', { auth: authKey });
    
    if (result && result.posts) {
        renderPosts(result.posts, feedContent);
    } else {
        feedContent.innerHTML = '<div class="no-content">Failed to load following feed. Please try again.</div>';
    }
}

// Search for a user profile
async function searchProfile() {
    if (!authKey) {
        showNotification('Please authenticate first', 'error');
        return;
    }
    
    const username = usernameSearchInput.value.trim();
    
    if (!username) {
        showNotification('Please enter a username', 'error');
        return;
    }
    
    showSection('profile');
    profileInfo.innerHTML = '<div class="loading">Loading profile...</div>';
    profilePosts.innerHTML = '';
    
    const result = await fetchAPI('profile', { name: username });
    
    if (result && result.user) {
        renderProfile(result.user, result.posts);
    } else {
        profileInfo.innerHTML = '<div class="no-content">User not found or error loading profile.</div>';
        profilePosts.innerHTML = '';
    }
}

// Follow a user
async function followUser() {
    const username = followUsernameInput.value.trim();
    
    if (!authKey) {
        showNotification('Please authenticate first', 'error');
        return;
    }
    
    if (!username) {
        showNotification('Please enter a username to follow', 'error');
        return;
    }
    
    const result = await fetchAPI('follow', { 
        auth: authKey,
        username: username
    });
    
    if (result && result.success) {
        showNotification(`You are now following ${username}`);
        
        // Get current user's following list if current username exists
        if (localStorage.getItem('currentUsername')) {
            listUsernameInput.value = localStorage.getItem('currentUsername');
            getFollowing();
        }
    }
}

// Unfollow a user
async function unfollowUser() {
    const username = followUsernameInput.value.trim();
    
    if (!authKey) {
        showNotification('Please authenticate first', 'error');
        return;
    }
    
    if (!username) {
        showNotification('Please enter a username to unfollow', 'error');
        return;
    }
    
    const result = await fetchAPI('unfollow', { 
        auth: authKey,
        username: username
    });
    
    if (result && result.success) {
        showNotification(`You have unfollowed ${username}`);
        
        // Get current user's following list if current username exists
        if (localStorage.getItem('currentUsername')) {
            listUsernameInput.value = localStorage.getItem('currentUsername');
            getFollowing();
        }
    }
}

// Get followers for a user
async function getFollowers() {
    if (!authKey) {
        showNotification('Please authenticate first', 'error');
        return;
    }
    
    const username = listUsernameInput.value.trim();
    
    if (!username) {
        showNotification('Please enter a username', 'error');
        return;
    }
    
    followList.innerHTML = '<div class="loading">Loading followers...</div>';
    
    const result = await fetchAPI('followers', { username: username });
    
    if (result && result.followers) {
        renderUserList(result.followers, 'followers');
    } else {
        followList.innerHTML = '<div class="no-content">Failed to load followers. Please try again.</div>';
    }
}

// Get users a user is following
async function getFollowing() {
    if (!authKey) {
        showNotification('Please authenticate first', 'error');
        return;
    }
    
    const username = listUsernameInput.value.trim();
    
    if (!username) {
        showNotification('Please enter a username', 'error');
        return;
    }
    
    followList.innerHTML = '<div class="loading">Loading following...</div>';
    
    const result = await fetchAPI('following', { username: username });
    
    if (result && result.following) {
        renderUserList(result.following, 'following');
    } else {
        followList.innerHTML = '<div class="no-content">Failed to load following. Please try again.</div>';
    }
}

// Rate a post (like/unlike)
async function ratePost(postId, rating) {
    if (!authKey) {
        showNotification('Please authenticate first', 'error');
        return false;
    }
    
    const result = await fetchAPI('rate', { 
        auth: authKey,
        id: postId,
        rating: rating
    });
    
    if (result && result.success) {
        showNotification(rating === 1 ? 'Post liked!' : 'Post unliked!');
        return true;
    }
    
    return false;
}

// Delete a post
async function deletePost(postId) {
    if (!authKey) {
        showNotification('Please authenticate first', 'error');
        return false;
    }
    
    if (!confirm('Are you sure you want to delete this post?')) {
        return false;
    }
    
    const result = await fetchAPI('delete', { 
        auth: authKey,
        id: postId
    });
    
    if (result && result.success) {
        showNotification('Post deleted successfully!');
        loadFeed();
        return true;
    }
    
    return false;
}

// Rendering functions
function renderPosts(posts, container) {
    if (!posts || posts.length === 0) {
        container.innerHTML = '<div class="no-content">No posts found</div>';
        return;
    }
    
    container.innerHTML = '';
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post-card';
        postElement.dataset.id = post.id;
        
        const postDate = new Date(post.timestamp * 1000);
        const formattedDate = postDate.toLocaleString();
        
        let attachmentHtml = '';
        if (post.attachment) {
            // Check if it's an image by extension
            if (/\.(jpeg|jpg|gif|png|webp)$/i.test(post.attachment)) {
                attachmentHtml = `<img src="${post.attachment}" alt="Attachment" class="post-attachment">`;
            } else {
                attachmentHtml = `<a href="${post.attachment}" target="_blank" class="post-attachment-link">View Attachment</a>`;
            }
        }
        
        postElement.innerHTML = `
            <div class="post-header">
                <span class="post-username">${post.username}</span>
                <span class="post-time">${formattedDate}</span>
            </div>
            <div class="post-content">${post.content}</div>
            ${attachmentHtml}
            <div class="post-actions">
                <button class="action-btn like-btn" data-id="${post.id}" data-action="like">
                    ${post.liked ? '❤️' : '🤍'} ${post.likes || 0}
                </button>
                ${post.is_owner ? `<button class="action-btn delete-btn" data-id="${post.id}">🗑️ Delete</button>` : ''}
            </div>
        `;
        
        container.appendChild(postElement);
        
        // Add event listeners
        const likeBtn = postElement.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', async (e) => {
                const postId = e.target.dataset.id;
                const newRating = post.liked ? 0 : 1;
                
                if (await ratePost(postId, newRating)) {
                    post.liked = !post.liked;
                    post.likes = post.liked ? (post.likes || 0) + 1 : (post.likes || 1) - 1;
                    likeBtn.innerHTML = `${post.liked ? '❤️' : '🤍'} ${post.likes || 0}`;
                }
            });
        }
        
        const deleteBtn = postElement.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
                const postId = e.target.dataset.id;
                await deletePost(postId);
            });
        }
        
        // Add click event to username for profile viewing
        const usernameElement = postElement.querySelector('.post-username');
        if (usernameElement) {
            usernameElement.style.cursor = 'pointer';
            usernameElement.addEventListener('click', () => {
                usernameSearchInput.value = post.username;
                searchProfile();
            });
        }
    });
}

function renderProfile(user, posts) {
    localStorage.setItem('currentUsername', user.username);
    
    profileInfo.innerHTML = `
        <h3>${user.username}</h3>
        <div class="profile-stats">
            <div class="stat">
                <div class="stat-value">${user.posts_count || 0}</div>
                <div class="stat-label">Posts</div>
            </div>
            <div class="stat">
                <div class="stat-value">${user.followers_count || 0}</div>
                <div class="stat-label">Followers</div>
            </div>
            <div class="stat">
                <div class="stat-value">${user.following_count || 0}</div>
                <div class="stat-label">Following</div>
            </div>
        </div>
    `;
    
    renderPosts(posts, profilePosts);
}

function renderUserList(users, type) {
    if (!users || users.length === 0) {
        followList.innerHTML = `<div class="no-content">No ${type} found</div>`;
        return;
    }
    
    followList.innerHTML = `<h3>${type === 'followers' ? 'Followers' : 'Following'}</h3>`;
    
    users.forEach(username => {
        const userElement = document.createElement('div');
        userElement.className = 'user-card';
        
        userElement.innerHTML = `
            <span class="username">${username}</span>
            <button class="view-profile-btn" data-username="${username}">View Profile</button>
        `;
        
        followList.appendChild(userElement);
        
        // Add event listener for profile view
        const viewProfileBtn = userElement.querySelector('.view-profile-btn');
        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', () => {
                usernameSearchInput.value = username;
                searchProfile();
            });
        }
    });
}

// Utility functions
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerText = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Theme handling
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const iconPath = document.querySelector('#theme-icon path');
    
    if (theme === 'dark') {
        iconPath.setAttribute('d', 'M12 10.999c1.437.438 2.562 1.564 2.999 3.001.44-1.437 1.565-2.562 3.001-3-1.436-.439-2.561-1.563-3.001-3-.437 1.436-1.562 2.561-2.999 2.999zm8.001.001c.958.293 1.707 1.042 2 2.001.291-.959 1.042-1.709 1.999-2.001-.957-.292-1.707-1.042-2-2-.293.958-1.042 1.708-1.999 2zm-1-9c-.437 1.437-1.563 2.562-2.998 3.001 1.438.44 2.561 1.564 3.001 3.002.437-1.438 1.563-2.563 2.996-3.002-1.433-.437-2.559-1.564-2.999-3.001zm-7.001 22c-6.617 0-12-5.383-12-12s5.383-12 12-12c1.894 0 3.63.497 5.37 1.179-2.948.504-9.37 3.266-9.37 10.821 0 7.454 5.917 10.208 9.37 10.821-1.5.846-3.476 1.179-5.37 1.179z');
    } else {
        iconPath.setAttribute('d', 'M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10v-20zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12z');
    }
}

// Card animation effect
document.addEventListener('mousemove', function(e) {
    document.querySelectorAll('.post-card, .profile-card, .user-card').forEach(card => {
        const rect = card.getBoundingClientRect(),
              x = e.clientX - rect.left,
              y = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
}); 