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
 * First-image URLs for legacy posts whose `image` column is empty in
 * published_posts (their images live base64-inline in content). Generated
 * Jul 29, 2026 from published_posts; the files live in /img/wave-thumbs/.
 * Lets pages render thumbnails without downloading full post content
 * (Supabase egress quota fix).
 */
const WAVE_THUMBS = {
  "blue-sky-thinking": "https://images.unsplash.com/photo-1580826237584-fda5b612e1bc?q=80&amp;w=1227&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.1.0&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "chatgpt-52-the-enterprise-inflection-point": "https://victordelrosal.com/img/5.2.png",
  "chatgpt-is-3": "https://i.postimg.cc/BQRX3fzW/chatgpt3bday.jpg",
  "coding-without-being-technical": "/img/wave-thumbs/coding-without-being-technical.jpg",
  "compass": "https://media.licdn.com/dms/image/v2/D4E22AQF-ljQ0GU0rEQ/feedshare-shrink_1280/B4EZqH6usRIUAs-/0/1763216912188?e=1766016000&amp;v=beta&amp;t=DJRYTw_bdg7TVWuuy5jytv6XvwzY_9686Ey0FMnk5ck",
  "creating-breathe": "https://victordelrosal.com/breathe/img/Breathe.png",
  "dsw-data-science-wizards-enterprise-ai-symposium-27-november-2025": "https://media.licdn.com/dms/image/v2/D4D22AQHypteIk-AiXQ/feedshare-shrink_2048_1536/B4DZrIfU3bKQA4-/0/1764300247425?e=1766016000&amp;v=beta&amp;t=-aP3NcwOvzJ3b-w2iYILe9uhchpW6--M5zPzi1AIvKM",
  "dsw-enterprise-ai-symposium-2025-in-dublin": "https://media.licdn.com/dms/image/v2/D5622AQFAR9n0EY23pA/feedshare-shrink_1280/B56ZrKitRRIcAs-/0/1764334687836?e=1766016000&amp;v=beta&amp;t=b7cil92BIUClj84T38ZY2Sql3DIWTaPA-x4-FiiaV9I",
  "echo5": "https://victordelrosal.com/img/echo5_photo.png",
  "first-wave": "https://victordelrosal.com/img/the-first-signal.png",
  "future-homo-sapiens": "https://i.postimg.cc/mTqnHLqj/Future-Homo-Sapiens.png",
  "hello-waves": "https://images.unsplash.com/photo-1616141893496-fbc65370493e?q=80&amp;w=1470&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.1.0&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "hello-world": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/HelloWorld.svg/2560px-HelloWorld.svg.png",
  "how-to-build-something-that-matters": "/img/wave-thumbs/how-to-build-something-that-matters.jpg",
  "how-to-start-vibe-coding": "/img/wave-thumbs/how-to-start-vibe-coding.jpg",
  "hows-the-week-going": "https://victordelrosal.com/img/HowsTheWeek.png",
  "i-tried-opencode-heres-what-i-learned": "https://opencode.ai/social-share.png",
  "introduction-the-economics-of-transformative-ai": "https://images.squarespace-cdn.com/content/v1/6691576f827f0850462cadb1/1764723613213-0X546W6UIF56HP3UZTMS/IntroBanner.png?format=750w",
  "large-language-models-will-never-be-intelligent-expert-says": "https://futurism.com/wp-content/uploads/2025/11/large-language-models-will-never-be-intelligent.jpg?w=1152&amp;h=768",
  "learning-ai-from-scratch-in-2026": "https://victordelrosal.com/img/learning-AI-2026.png",
  "netflix-generative-ai-content-mock": "/img/wave-thumbs/netflix-generative-ai-content-mock.jpg",
  "one-day-three-systems-an-ode-to-vibe-coding": "/img/wave-thumbs/one-day-three-systems-an-ode-to-vibe-coding.jpg",
  "pay-with-squats": "/img/wave-thumbs/pay-with-squats.jpg",
  "remember-minority-report": "https://miro.medium.com/1*6EL4Mcv22wLxck3NMfMcBA.jpeg",
  "rip-photographic-evidence-1826-2025": "https://media.licdn.com/dms/image/v2/D4D22AQHQveJX4dEnSg/feedshare-shrink_2048_1536/B4DZrPTszPKQAw-/0/1764414641134?e=1767830400&amp;v=beta&amp;t=S3WqYvja6dS9sgyJ4OkxLeNdUCuJWAoXQwoxwHM3hMk",
  "schotts-significa": "https://victordelrosal.com/img/Schotts-Significa-sq.jpg",
  "the-ai-innovator": "https://victordelrosal.com/ai-innovator/img/The-AI-Innovator.png",
  "the-deep-forensic-inquiry-prompt": "https://victordelrosal.com/img/typewriter.png",
  "the-purpose-layer": "https://victordelrosal.com/img/purpose-layer.png",
  "tool-or-digital-colleague": "/img/wave-thumbs/tool-or-digital-colleague.jpg",
  "vibe-code-secaudit-prompt": "https://i.imgur.com/Y30CZRr_d.webp?maxwidth=1520&amp;fidelity=grand",
  "waking": "https://victordelrosal.com/img/waking-header.png",
  "what-160-projects-taught-me-about-working-with-claude": "/img/wave-thumbs/what-160-projects-taught-me-about-working-with-claude.jpg",
  "what-comes-after-the-transformer": "https://victordelrosal.com/img/transformer.png",
  "youre-reading-the-wrong-curve": "https://media.licdn.com/dms/image/v2/D4D12AQG7eZHtcudzsg/article-cover_image-shrink_720_1280/B4DZpoZTqHIEAI-/0/1762688059329?e=1766016000&amp;v=beta&amp;t=nv9KgK69Y0QcL2Ab1WlqZ1rOB0fclAZ08H3JrlWbgRI",
};

/**
 * Best available thumbnail/preview image for a post row (works with light rows).
 * @param {Object} post - Post row (needs slug; uses image if present)
 * @returns {string|null} Image URL or null
 */
function getPostImage(post) {
  return (post && (post.image || WAVE_THUMBS[post.slug])) || null;
}

/**
 * Fetch published posts WITHOUT content (id, slug, title, image, published_at).
 * Use for navigation, thumbnails, and lists: the full table is ~15 MB with
 * content, ~40 KB without (Jul 2026 egress incident).
 * @param {Object} options - {limit, offset} as in fetchPosts
 * @returns {Promise<Array>} Array of light post rows
 */
async function fetchPostsLight(options = {}) {
  const config = getSupabaseConfig();
  if (!config) return [];

  const { limit, offset } = options;
  let url = `${config.url}/rest/v1/published_posts?select=id,slug,title,image,published_at&order=published_at.desc`;
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
    console.error('Failed to fetch posts (light):', error);
    return [];
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
  fetchPostsLight,
  fetchPostBySlug,
  getPostImage,
  formatDate,
  createExcerpt,
};
