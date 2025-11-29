/**
 * Page Views Tracking
 * Tracks and displays view counts for waves/posts
 */

const PageViews = {
  /**
   * Track a page view and get the new count
   * @param {string} slug - The post slug
   * @returns {Promise<number|null>} The new view count or null on error
   */
  async trackView(slug) {
    const supabase = window.SupabaseClient?.getClient();
    if (!supabase) {
      console.error('Supabase client not available');
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('increment_page_view', { slug });

      if (error) {
        console.error('Failed to track view:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to track view:', error);
      return null;
    }
  },

  /**
   * Get the view count for a single post
   * @param {string} slug - The post slug
   * @returns {Promise<number>} The view count (0 if not found)
   */
  async getViewCount(slug) {
    const supabase = window.SupabaseClient?.getClient();
    if (!supabase) return 0;

    try {
      const { data, error } = await supabase
        .from('page_view_counts')
        .select('view_count')
        .eq('post_slug', slug)
        .single();

      if (error) {
        // PGRST116 = not found, which is fine
        if (error.code !== 'PGRST116') {
          console.error('Failed to get view count:', error);
        }
        return 0;
      }

      return data?.view_count || 0;
    } catch (error) {
      console.error('Failed to get view count:', error);
      return 0;
    }
  },

  /**
   * Get view counts for multiple posts at once
   * @param {string[]} slugs - Array of post slugs
   * @returns {Promise<Object>} Map of slug -> view count
   */
  async getViewCounts(slugs) {
    const supabase = window.SupabaseClient?.getClient();
    if (!supabase || !slugs.length) return {};

    try {
      const { data, error } = await supabase
        .from('page_view_counts')
        .select('post_slug, view_count')
        .in('post_slug', slugs);

      if (error) {
        console.error('Failed to get view counts:', error);
        return {};
      }

      // Convert to map
      const countMap = {};
      (data || []).forEach(item => {
        countMap[item.post_slug] = item.view_count;
      });

      return countMap;
    } catch (error) {
      console.error('Failed to get view counts:', error);
      return {};
    }
  },

  /**
   * Format a view count for display
   * @param {number} count - The raw count
   * @returns {string} Formatted string (e.g., "1.2K", "3.5M")
   */
  formatCount(count) {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
  },

  /**
   * Create the view count display HTML
   * @param {number} count - The view count
   * @returns {string} HTML string for the view count display
   */
  createViewCountHTML(count) {
    const formatted = this.formatCount(count);
    return `
      <div class="view-count-display">
        <svg class="view-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <span class="view-count-number">${formatted}</span>
        <span class="view-count-label">views</span>
      </div>
    `;
  },

  /**
   * Create a compact view count badge for cards
   * @param {number} count - The view count
   * @returns {string} HTML string for the compact badge
   */
  createViewBadgeHTML(count) {
    if (!count || count === 0) return '';
    const formatted = this.formatCount(count);
    return `
      <span class="wave-view-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        ${formatted}
      </span>
    `;
  }
};

// Export to global scope
window.PageViews = PageViews;
