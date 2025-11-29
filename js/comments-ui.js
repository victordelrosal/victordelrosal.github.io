/**
 * Comments UI
 * Renders and manages the comments interface
 */

const CommentsUI = {
  currentSlug: null,
  replyingTo: null,

  /**
   * Initialize the comments UI for a post
   * @param {string} slug - The post slug
   * @param {string} containerId - ID of the container element
   */
  async init(slug, containerId = 'comments-section') {
    this.currentSlug = slug;
    this.container = document.getElementById(containerId);

    if (!this.container) {
      console.error('Comments container not found:', containerId);
      return;
    }

    // Render the comments structure
    this.renderStructure();

    // Set up auth state listener
    window.SupabaseClient.onAuthStateChange((user, profile) => {
      this.updateAuthUI(user, profile);
    });

    // Load and render comments
    await this.loadAndRenderComments();

    // Set up event listeners
    this.setupEventListeners();
  },

  /**
   * Render the base comments structure
   */
  renderStructure() {
    this.container.innerHTML = `
      <h3 class="comments-title">Comments</h3>

      <!-- Auth Section -->
      <div id="auth-section" class="auth-section">
        <div id="signed-out-prompt" class="auth-prompt">
          <p>Sign in to join the conversation</p>
          <button class="btn-google-signin" id="google-signin-btn">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        <div id="signed-in-section" class="user-section" style="display: none;">
          <div class="user-info">
            <img id="user-avatar" src="" alt="" class="user-avatar">
            <span id="user-name" class="user-name"></span>
            <button id="sign-out-btn" class="btn-signout">Sign out</button>
          </div>
        </div>
      </div>

      <!-- Comment Form -->
      <form id="comment-form" class="comment-form" style="display: none;">
        <textarea
          id="comment-input"
          class="comment-input"
          placeholder="Share your thoughts..."
          maxlength="2000"
          rows="3"
        ></textarea>
        <div class="comment-form-actions">
          <span class="char-count">
            <span id="char-current">0</span>/2000
          </span>
          <button type="submit" class="btn-submit-comment" id="submit-comment-btn">
            Post Comment
          </button>
        </div>
      </form>

      <!-- Reply Form (hidden, moved when replying) -->
      <form id="reply-form" class="reply-form" style="display: none;">
        <div class="reply-form-header">
          <span>Replying to <span id="replying-to-name"></span></span>
          <button type="button" class="btn-cancel-reply" id="cancel-reply-btn">Cancel</button>
        </div>
        <textarea
          id="reply-input"
          class="comment-input reply-input"
          placeholder="Write a reply..."
          maxlength="2000"
          rows="2"
        ></textarea>
        <div class="comment-form-actions">
          <span class="char-count">
            <span id="reply-char-current">0</span>/2000
          </span>
          <button type="submit" class="btn-submit-comment">Post Reply</button>
        </div>
      </form>

      <!-- Comments List -->
      <div id="comments-list" class="comments-list"></div>

      <!-- Empty State -->
      <div id="comments-empty" class="comments-empty" style="display: none;">
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>

      <!-- Loading State -->
      <div id="comments-loading" class="comments-loading">
        <div class="loading-spinner"></div>
        <p>Loading comments...</p>
      </div>
    `;
  },

  /**
   * Update the auth UI based on current state
   */
  updateAuthUI(user, profile) {
    const signedOutPrompt = document.getElementById('signed-out-prompt');
    const signedInSection = document.getElementById('signed-in-section');
    const commentForm = document.getElementById('comment-form');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');

    if (user && profile) {
      // User is signed in
      signedOutPrompt.style.display = 'none';
      signedInSection.style.display = 'block';
      commentForm.style.display = 'block';

      userAvatar.src = profile.avatar_url || '';
      userAvatar.alt = profile.display_name;
      userName.textContent = profile.display_name;
    } else {
      // User is signed out
      signedOutPrompt.style.display = 'block';
      signedInSection.style.display = 'none';
      commentForm.style.display = 'none';

      // Also hide any open reply forms
      this.hideReplyForm();
    }
  },

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Google sign in
    const signInBtn = document.getElementById('google-signin-btn');
    if (signInBtn) {
      signInBtn.addEventListener('click', async () => {
        try {
          await window.SupabaseClient.signInWithGoogle();
        } catch (error) {
          console.error('Sign in failed:', error);
        }
      });
    }

    // Sign out
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', async () => {
        try {
          await window.SupabaseClient.signOut();
        } catch (error) {
          console.error('Sign out failed:', error);
        }
      });
    }

    // Comment form submission
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
      commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.submitComment();
      });
    }

    // Reply form submission
    const replyForm = document.getElementById('reply-form');
    if (replyForm) {
      replyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.submitReply();
      });
    }

    // Cancel reply
    const cancelReplyBtn = document.getElementById('cancel-reply-btn');
    if (cancelReplyBtn) {
      cancelReplyBtn.addEventListener('click', () => {
        this.hideReplyForm();
      });
    }

    // Character count for comment input
    const commentInput = document.getElementById('comment-input');
    if (commentInput) {
      commentInput.addEventListener('input', () => {
        document.getElementById('char-current').textContent = commentInput.value.length;
      });
    }

    // Character count for reply input
    const replyInput = document.getElementById('reply-input');
    if (replyInput) {
      replyInput.addEventListener('input', () => {
        document.getElementById('reply-char-current').textContent = replyInput.value.length;
      });
    }
  },

  /**
   * Load and render comments
   */
  async loadAndRenderComments() {
    const loadingEl = document.getElementById('comments-loading');
    const listEl = document.getElementById('comments-list');
    const emptyEl = document.getElementById('comments-empty');

    try {
      const comments = await window.Comments.loadComments(this.currentSlug);
      const tree = window.Comments.buildCommentTree(comments);

      loadingEl.style.display = 'none';

      if (tree.length === 0) {
        emptyEl.style.display = 'block';
        listEl.innerHTML = '';
      } else {
        emptyEl.style.display = 'none';
        listEl.innerHTML = this.renderCommentTree(tree);
        this.attachCommentListeners();
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      loadingEl.innerHTML = '<p class="error">Failed to load comments. Please refresh the page.</p>';
    }
  },

  /**
   * Render a tree of comments to HTML
   */
  renderCommentTree(comments, depth = 0) {
    return comments.map(comment => this.renderComment(comment, depth)).join('');
  },

  /**
   * Render a single comment
   */
  renderComment(comment, depth = 0) {
    const isAdmin = window.SupabaseClient?.isAdmin();
    const currentProfile = window.SupabaseClient?.getUserProfile();
    const canDelete = isAdmin || (currentProfile && currentProfile.id === comment.user_id);

    const repliesHTML = comment.replies && comment.replies.length > 0
      ? `<div class="comment-replies">${this.renderCommentTree(comment.replies, depth + 1)}</div>`
      : '';

    const adminBadge = comment.is_author_admin
      ? '<span class="admin-badge">Admin</span>'
      : '';

    const deleteBtn = canDelete
      ? `<button class="comment-action-btn delete-btn" data-comment-id="${comment.id}">Delete</button>`
      : '';

    const replyBtn = window.SupabaseClient?.getCurrentUser()
      ? `<button class="comment-action-btn reply-btn" data-comment-id="${comment.id}" data-author-name="${window.Comments.escapeHTML(comment.display_name)}">Reply</button>`
      : '';

    return `
      <div class="comment" data-comment-id="${comment.id}" data-depth="${depth}">
        <div class="comment-header">
          <img
            class="comment-avatar"
            src="${comment.avatar_url || ''}"
            alt="${window.Comments.escapeHTML(comment.display_name)}"
            onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23ccc%22><circle cx=%2212%22 cy=%228%22 r=%224%22/><path d=%22M12 14c-6 0-8 3-8 6v2h16v-2c0-3-2-6-8-6z%22/></svg>'"
          >
          <div class="comment-meta">
            <span class="comment-author">${window.Comments.escapeHTML(comment.display_name)}</span>
            ${adminBadge}
            <span class="comment-time">${window.Comments.timeAgo(comment.created_at)}</span>
          </div>
        </div>
        <div class="comment-content">${window.Comments.linkify(comment.content)}</div>
        <div class="comment-actions">
          ${replyBtn}
          ${deleteBtn}
        </div>
        <div class="reply-form-container" id="reply-container-${comment.id}"></div>
        ${repliesHTML}
      </div>
    `;
  },

  /**
   * Attach event listeners to comment actions
   */
  attachCommentListeners() {
    // Reply buttons
    document.querySelectorAll('.reply-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const commentId = e.target.dataset.commentId;
        const authorName = e.target.dataset.authorName;
        this.showReplyForm(commentId, authorName);
      });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const commentId = e.target.dataset.commentId;
        if (confirm('Are you sure you want to delete this comment?')) {
          await this.deleteComment(commentId);
        }
      });
    });
  },

  /**
   * Show the reply form for a specific comment
   */
  showReplyForm(commentId, authorName) {
    // Hide any existing reply form
    this.hideReplyForm();

    this.replyingTo = commentId;

    const replyForm = document.getElementById('reply-form');
    const container = document.getElementById(`reply-container-${commentId}`);
    const replyingToName = document.getElementById('replying-to-name');

    if (replyForm && container) {
      replyingToName.textContent = authorName;
      container.appendChild(replyForm);
      replyForm.style.display = 'block';
      document.getElementById('reply-input').focus();
    }
  },

  /**
   * Hide the reply form
   */
  hideReplyForm() {
    this.replyingTo = null;
    const replyForm = document.getElementById('reply-form');
    if (replyForm) {
      replyForm.style.display = 'none';
      document.getElementById('reply-input').value = '';
      document.getElementById('reply-char-current').textContent = '0';
      // Move it back to the main container so it's not lost
      this.container.appendChild(replyForm);
    }
  },

  /**
   * Submit a new top-level comment
   */
  async submitComment() {
    const input = document.getElementById('comment-input');
    const submitBtn = document.getElementById('submit-comment-btn');
    const content = input.value.trim();

    if (!content) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    try {
      await window.Comments.postComment(this.currentSlug, content);
      input.value = '';
      document.getElementById('char-current').textContent = '0';
      await this.loadAndRenderComments();
    } catch (error) {
      alert(error.message || 'Failed to post comment');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post Comment';
    }
  },

  /**
   * Submit a reply to a comment
   */
  async submitReply() {
    if (!this.replyingTo) return;

    const input = document.getElementById('reply-input');
    const content = input.value.trim();

    if (!content) return;

    const submitBtn = document.querySelector('#reply-form .btn-submit-comment');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    try {
      await window.Comments.postComment(this.currentSlug, content, this.replyingTo);
      this.hideReplyForm();
      await this.loadAndRenderComments();
    } catch (error) {
      alert(error.message || 'Failed to post reply');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post Reply';
    }
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId) {
    try {
      await window.Comments.deleteComment(commentId);
      await this.loadAndRenderComments();
    } catch (error) {
      alert(error.message || 'Failed to delete comment');
    }
  }
};

// Export to global scope
window.CommentsUI = CommentsUI;
