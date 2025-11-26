/**
 * Posts API for victordelrosal.com
 * Fetches published posts from Supabase
 */

// Supabase Configuration (same as Flux app)
const SUPABASE_URL = 'https://azzzrjnqgkqwpqnroost.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6enpyam5xZ2txd3BxbnJvb3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NDU5MzEsImV4cCI6MjA3NzEyMTkzMX0.sVQTpX_ilu_366c9HhCUmKL1YOhRZo5N4YKVoIMoTyE';

/**
 * Fetch all published posts
 * @returns {Promise<Array>} Array of published posts
 */
async function fetchPosts() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/published_posts?select=*&order=published_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

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
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/published_posts?slug=eq.${encodeURIComponent(slug)}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
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
