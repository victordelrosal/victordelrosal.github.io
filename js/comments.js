/**
 * Comments System
 * Handles loading, posting, and managing comments
 */

const Comments = {
  /**
   * Load all comments for a post
   * @param {string} slug - The post slug
   * @returns {Promise<Array>} Array of comments with user info
   */
  async loadComments(slug) {
    const supabase = window.SupabaseClient?.getClient();
    if (!supabase) {
      console.error('Supabase client not available');
      return [];
    }

    try {
      const { data, error } = await supabase.rpc('get_comments_for_post', { slug });

      if (error) {
        console.error('Failed to load comments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to load comments:', error);
      return [];
    }
  },

  /**
   * Post a new comment
   * @param {string} slug - The post slug
   * @param {string} content - The comment content
   * @param {string|null} parentId - Parent comment ID for replies (null for top-level)
   * @returns {Promise<Object>} The created comment
   */
  async postComment(slug, content, parentId = null) {
    const profile = window.SupabaseClient?.getUserProfile();
    if (!profile) {
      throw new Error('You must be signed in to comment');
    }

    const supabase = window.SupabaseClient.getClient();
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new Error('Comment cannot be empty');
    }

    if (trimmedContent.length > 2000) {
      throw new Error('Comment is too long (max 2000 characters)');
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_slug: slug,
          user_id: profile.id,
          content: trimmedContent,
          parent_id: parentId
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to post comment:', error);
        throw new Error('Failed to post comment. Please try again.');
      }

      return data;
    } catch (error) {
      if (error.message === 'Failed to post comment. Please try again.') {
        throw error;
      }
      console.error('Failed to post comment:', error);
      throw new Error('Failed to post comment. Please try again.');
    }
  },

  /**
   * Delete a comment (soft delete)
   * @param {string} commentId - The comment ID to delete
   * @returns {Promise<void>}
   */
  async deleteComment(commentId) {
    const supabase = window.SupabaseClient?.getClient();
    if (!supabase) {
      throw new Error('Not connected');
    }

    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', commentId);

      if (error) {
        console.error('Failed to delete comment:', error);
        throw new Error('Failed to delete comment');
      }
    } catch (error) {
      if (error.message === 'Failed to delete comment') {
        throw error;
      }
      console.error('Failed to delete comment:', error);
      throw new Error('Failed to delete comment');
    }
  },

  /**
   * Build a tree structure from flat comments array
   * @param {Array} comments - Flat array of comments
   * @returns {Array} Tree of comments with nested replies
   */
  buildCommentTree(comments) {
    const map = new Map();
    const roots = [];

    // First pass: create map of all comments
    comments.forEach(comment => {
      map.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree structure
    comments.forEach(comment => {
      const node = map.get(comment.id);
      if (comment.parent_id && map.has(comment.parent_id)) {
        map.get(comment.parent_id).replies.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  },

  /**
   * Format a timestamp as relative time
   * @param {string} dateString - ISO date string
   * @returns {string} Relative time (e.g., "2 hours ago")
   */
  timeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 }
    ];

    for (const { label, seconds: s } of intervals) {
      const count = Math.floor(seconds / s);
      if (count >= 1) {
        return `${count} ${label}${count !== 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  },

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Raw text
   * @returns {string} Escaped HTML-safe text
   */
  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Convert URLs in text to clickable links
   * @param {string} text - Text that may contain URLs
   * @returns {string} Text with URLs wrapped in anchor tags
   */
  linkify(text) {
    const escaped = this.escapeHTML(text);
    const urlPattern = /(https?:\/\/[^\s<]+)/g;
    return escaped.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  },

  /**
   * Get comment count for a post
   * @param {string} slug - The post slug
   * @returns {Promise<number>} The comment count
   */
  async getCommentCount(slug) {
    const supabase = window.SupabaseClient?.getClient();
    if (!supabase) return 0;

    try {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_slug', slug)
        .eq('is_deleted', false);

      if (error) {
        console.error('Failed to get comment count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Failed to get comment count:', error);
      return 0;
    }
  }
};

// Export to global scope
window.Comments = Comments;
