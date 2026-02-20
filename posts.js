/**
 * Posts API for victordelrosal.com
 * Fetches published posts from Supabase
 *
 * Note: Credentials are sourced from SupabaseClient (js/supabase-client.js)
 * to maintain a single source of truth.
 */

/**
 * Get Supabase configuration from SupabaseClient
 * Uses lazy loading since supabase-client.js may load after this file
 */
function getSupabaseConfig() {
  if (window.SupabaseClient) {
    return {
      url: window.SupabaseClient.SUPABASE_URL,
      key: window.SupabaseClient.SUPABASE_ANON_KEY
    };
  }
  console.error('SupabaseClient not loaded - ensure supabase-client.js is included');
  return null;
}

/**
 * Fetch published posts with optional pagination
 * @param {Object} options - Fetch options
 * @param {number} [options.limit] - Max posts to return
 * @param {number} [options.offset] - Number of posts to skip
 * @returns {Promise<Array>} Array of published posts
 */
async function fetchPosts(options = {}) {
  const config = getSupabaseConfig();
  if (!config) return [];

  const { limit, offset } = options;
  let url = `${config.url}/rest/v1/published_posts?select=*&order=published_at.desc`;
  if (limit) url += `&limit=${limit}`;
  if (offset) url += `&offset=${offset}`;

  try {
    const response = await fetch(url, {
      headers: {
        'apikey': config.key,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return [];
  }
}

/**
 * Fetch a single post by slug
 * @param {string} slug - The URL slug of the post
 * @returns {Promise<Object|null>} The post object or null if not found
 */
async function fetchPostBySlug(slug) {
  const config = getSupabaseConfig();
  if (!config) return null;

  try {
    const response = await fetch(
      `${config.url}/rest/v1/published_posts?slug=eq.${encodeURIComponent(slug)}&select=*`,
      {
        headers: {
          'apikey': config.key,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const posts = await response.json();
    return posts[0] || null;
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return null;
  }
}

/**
 * Format a date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Create an excerpt from HTML content
 * @param {string} html - HTML content
 * @param {number} maxLength - Maximum length of excerpt
 * @returns {string} Plain text excerpt
 */
function createExcerpt(html, maxLength = 200) {
  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Make functions available globally
window.PostsAPI = {
  fetchPosts,
  fetchPostBySlug,
  formatDate,
  createExcerpt,
};
