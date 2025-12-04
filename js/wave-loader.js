/**
 * Wave Loader - Loads wave content dynamically
 * Used by both 404.html (catch-all) and generated static wave pages
 */

(function() {
    // Get slug from URL or from inline variable (set by generated pages)
    const path = window.location.pathname;
    const slug = window.waveSlug || path.replace(/^\//, '').replace(/\/$/, '');

    // Skip if we're on the homepage or waves page
    if (!slug || slug === 'index.html' || slug === 'waves' || slug.includes('.')) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('not-found').style.display = 'block';
        return;
    }

    (async function() {
        try {
            const post = await window.PostsAPI.fetchPostBySlug(slug);

            if (post) {
                const excerpt = window.PostsAPI.createExcerpt(post.content, 160);
                const postUrl = `https://victordelrosal.com/${slug}`;

                // Update meta tags (for 404.html fallback - generated pages already have correct meta)
                document.title = `${post.title} | Victor del Rosal`;
                const descMeta = document.querySelector('meta[name="description"]');
                if (descMeta) descMeta.content = excerpt;

                function stripFirstLine(html) {
                    const temp = document.createElement('div');
                    temp.innerHTML = html;
                    if (temp.firstElementChild) temp.removeChild(temp.firstElementChild);
                    return temp.innerHTML.trim();
                }

                // XSS Protection: Sanitize HTML content before rendering
                function sanitizeHTML(html) {
                    if (typeof DOMPurify !== 'undefined') {
                        return DOMPurify.sanitize(html, {
                            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'img', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'div', 'span', 'figure', 'figcaption', 'iframe'],
                            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'width', 'height', 'allowfullscreen', 'allow', 'loading', 'style'],
                            ALLOW_DATA_ATTR: false
                        });
                    }
                    console.warn('DOMPurify not loaded - content not sanitized');
                    return html;
                }

                // Escape HTML for use in template literals (titles, etc.)
                function escapeHTML(str) {
                    const div = document.createElement('div');
                    div.textContent = str;
                    return div.innerHTML;
                }

                function getYouTubeVideoId(url) {
                    const patterns = [
                        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
                        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
                    ];
                    for (const pattern of patterns) {
                        const match = url.match(pattern);
                        if (match) return match[1];
                    }
                    return null;
                }

                function createYouTubeEmbed(videoId) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'youtube-embed';
                    wrapper.style.cssText = 'position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 40px 0; border-radius: 16px; box-shadow: 0 12px 48px rgba(0,0,0,0.12);';
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${videoId}`;
                    iframe.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 16px;';
                    iframe.setAttribute('allowfullscreen', '');
                    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                    iframe.setAttribute('loading', 'lazy');
                    wrapper.appendChild(iframe);
                    return wrapper;
                }

                function linkifyUrls(html) {
                    const temp = document.createElement('div');
                    temp.innerHTML = html;

                    const youtubeLinks = temp.querySelectorAll('a[href*="youtube.com"], a[href*="youtu.be"]');
                    youtubeLinks.forEach(link => {
                        const youtubeId = getYouTubeVideoId(link.href);
                        if (youtubeId) {
                            const embed = createYouTubeEmbed(youtubeId);
                            link.parentNode.replaceChild(embed, link);
                        }
                    });

                    const walker = document.createTreeWalker(temp, NodeFilter.SHOW_TEXT, null, false);
                    const textNodes = [];
                    let node;
                    while (node = walker.nextNode()) {
                        if (node.parentElement.tagName !== 'A') textNodes.push(node);
                    }
                    const urlPattern = /(https?:\/\/[^\s<>"']+)/g;
                    textNodes.forEach(textNode => {
                        const text = textNode.textContent;
                        if (urlPattern.test(text)) {
                            const fragment = document.createDocumentFragment();
                            let lastIndex = 0;
                            let match;
                            urlPattern.lastIndex = 0;
                            while ((match = urlPattern.exec(text)) !== null) {
                                if (match.index > lastIndex) fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
                                const url = match[0];
                                const youtubeId = getYouTubeVideoId(url);
                                if (youtubeId) {
                                    fragment.appendChild(createYouTubeEmbed(youtubeId));
                                } else {
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.textContent = url;
                                    link.target = '_blank';
                                    link.rel = 'noopener noreferrer';
                                    fragment.appendChild(link);
                                }
                                lastIndex = match.index + match[0].length;
                            }
                            if (lastIndex < text.length) fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
                            textNode.parentNode.replaceChild(fragment, textNode);
                        }
                    });
                    return temp.innerHTML;
                }

                document.getElementById('post-date').textContent = window.PostsAPI.formatDate(post.published_at);
                document.getElementById('post-title').textContent = post.title;
                document.getElementById('post-content').innerHTML = sanitizeHTML(linkifyUrls(stripFirstLine(post.content)));
                document.getElementById('loading').style.display = 'none';
                document.getElementById('post').classList.add('visible');

                // Font size control
                (function() {
                    const postContent = document.getElementById('post-content');
                    const fontSizeButtons = document.querySelectorAll('.font-size-btn');
                    const storageKey = 'wave-font-size';

                    function setFontSize(size) {
                        postContent.classList.remove('font-size-1', 'font-size-2', 'font-size-3', 'font-size-4', 'font-size-5');
                        postContent.classList.add('font-size-' + size);
                        document.querySelectorAll('.comment-content').forEach(el => {
                            el.classList.remove('font-size-1', 'font-size-2', 'font-size-3', 'font-size-4', 'font-size-5');
                            el.classList.add('font-size-' + size);
                        });
                        fontSizeButtons.forEach(btn => {
                            btn.classList.toggle('active', btn.dataset.size === String(size));
                        });
                        localStorage.setItem(storageKey, size);
                    }

                    const savedSize = localStorage.getItem(storageKey) || '3';
                    setFontSize(savedSize);

                    fontSizeButtons.forEach(btn => {
                        btn.addEventListener('click', () => setFontSize(btn.dataset.size));
                    });
                })();

                // Track page view and display count
                if (window.PageViews && window.SupabaseClient) {
                    (async function() {
                        try {
                            const viewCount = await window.PageViews.trackView(slug);
                            if (viewCount !== null) {
                                document.getElementById('view-count-container').innerHTML = window.PageViews.createViewCountHTML(viewCount);
                            }
                        } catch (e) {
                            console.error('Failed to track view:', e);
                        }
                    })();

                    window.SupabaseClient.initAuth().then(() => {
                        if (window.CommentsUI) {
                            window.CommentsUI.init(slug, 'comments-section');
                        }
                    }).catch(e => console.error('Failed to init auth:', e));

                    // Wave reaction
                    (async function() {
                        const waveBtn = document.getElementById('wave-reaction-btn');
                        const waveEmoji = waveBtn.querySelector('.wave-emoji');
                        const waveCountEl = document.getElementById('wave-count');
                        const storageKey = 'wave-reacted-' + slug;
                        const visitorKey = 'wave-visitor-id';

                        let visitorId = localStorage.getItem(visitorKey);
                        if (!visitorId) {
                            visitorId = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
                            localStorage.setItem(visitorKey, visitorId);
                        }

                        const hasWaved = localStorage.getItem(storageKey) === 'true';
                        if (hasWaved) waveBtn.classList.add('waved');

                        try {
                            const supabase = window.SupabaseClient.getClient();
                            const { data } = await supabase.rpc('get_wave_count', { p_slug: slug });
                            waveCountEl.textContent = data || 0;
                        } catch (e) {
                            console.error('Failed to load wave count:', e);
                        }

                        function triggerWaveAnimation() {
                            waveEmoji.classList.remove('waving');
                            void waveEmoji.offsetWidth;
                            waveEmoji.classList.add('waving');
                        }

                        waveBtn.addEventListener('click', async () => {
                            triggerWaveAnimation();
                            if (localStorage.getItem(storageKey) === 'true') return;

                            try {
                                const supabase = window.SupabaseClient.getClient();
                                const { data } = await supabase.rpc('add_wave_reaction', {
                                    p_slug: slug,
                                    p_visitor_id: visitorId
                                });
                                waveCountEl.textContent = data || 0;
                                localStorage.setItem(storageKey, 'true');
                                waveBtn.classList.add('waved');
                            } catch (e) {
                                console.error('Failed to add wave:', e);
                            }
                        });
                    })();
                }

                const shareText = `${post.title} by Victor del Rosal`;

                document.getElementById('share-whatsapp').addEventListener('click', () => {
                    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + postUrl)}`, '_blank');
                });
                document.getElementById('share-linkedin').addEventListener('click', () => {
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`, '_blank');
                });
                document.getElementById('share-x').addEventListener('click', () => {
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`, '_blank');
                });
                document.getElementById('share-bluesky').addEventListener('click', () => {
                    window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(shareText + '\n' + postUrl)}`, '_blank');
                });
                document.getElementById('share-copy').addEventListener('click', async (e) => {
                    const btn = e.currentTarget;
                    try {
                        await navigator.clipboard.writeText(postUrl);
                        btn.classList.add('copied');
                        setTimeout(() => btn.classList.remove('copied'), 2000);
                    } catch (err) {
                        const ta = document.createElement('textarea');
                        ta.value = postUrl;
                        ta.style.cssText = 'position:fixed;left:-999999px';
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                        btn.classList.add('copied');
                        setTimeout(() => btn.classList.remove('copied'), 2000);
                    }
                });

                // Wave navigation and thumbnails
                (async function() {
                    try {
                        const allPosts = await window.PostsAPI.fetchPosts();
                        const currentIndex = allPosts.findIndex(p => p.slug === slug);
                        const isDesktop = window.innerWidth > 1100;

                        if (isDesktop && currentIndex > 0) {
                            const prevPost = allPosts[currentIndex - 1];
                            const prevNav = document.getElementById('nav-prev');
                            prevNav.href = '/' + prevPost.slug;
                            prevNav.title = prevPost.title;
                            prevNav.style.display = 'flex';
                        }

                        if (isDesktop && currentIndex < allPosts.length - 1) {
                            const nextPost = allPosts[currentIndex + 1];
                            const nextNav = document.getElementById('nav-next');
                            nextNav.href = '/' + nextPost.slug;
                            nextNav.title = nextPost.title;
                            nextNav.style.display = 'flex';
                        }

                        const thumbnailsContainer = document.getElementById('wave-thumbnails');

                        function getFirstImage(html) {
                            const temp = document.createElement('div');
                            temp.innerHTML = html;
                            const img = temp.querySelector('img');
                            return img ? img.src : null;
                        }

                        function formatThumbDate(dateStr) {
                            const date = new Date(dateStr);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        }

                        const postsWithImages = allPosts
                            .filter(p => p.slug !== slug && getFirstImage(p.content))
                            .slice(0, 12);

                        postsWithImages.forEach(p => {
                            const thumb = document.createElement('a');
                            thumb.href = '/' + p.slug;
                            thumb.className = 'wave-thumb-item';
                            const imageUrl = getFirstImage(p.content);
                            thumb.innerHTML = `
                                <div class="thumb-img">
                                    <img src="${imageUrl}" alt="" loading="lazy">
                                </div>
                                <div class="thumb-preview">
                                    <div class="thumb-preview-img">
                                        <img src="${imageUrl}" alt="">
                                    </div>
                                    <div class="thumb-preview-date">${formatThumbDate(p.published_at)}</div>
                                    <div class="thumb-preview-title">${escapeHTML(p.title)}</div>
                                </div>
                            `;
                            thumbnailsContainer.appendChild(thumb);
                        });
                    } catch (e) {
                        console.error('Failed to set up wave navigation:', e);
                    }
                })();

                // Sticky footer functionality
                (function() {
                    const stickyFooter = document.getElementById('sticky-footer');
                    const stickyWaveBtn = document.getElementById('sticky-wave-btn');
                    const stickyWaveEmoji = stickyWaveBtn.querySelector('.wave-emoji');
                    const stickyWaveCount = document.getElementById('sticky-wave-count');
                    const mainWaveCount = document.getElementById('wave-count');

                    function syncWaveCount() {
                        const count = mainWaveCount.textContent;
                        if (count && count !== '0') stickyWaveCount.textContent = count;
                    }

                    const observer = new MutationObserver(syncWaveCount);
                    observer.observe(mainWaveCount, { childList: true, characterData: true, subtree: true });
                    syncWaveCount();

                    const storageKey = 'wave-reacted-' + slug;
                    if (localStorage.getItem(storageKey) === 'true') stickyWaveBtn.classList.add('waved');

                    stickyWaveBtn.addEventListener('click', async () => {
                        stickyWaveEmoji.classList.remove('waving');
                        void stickyWaveEmoji.offsetWidth;
                        stickyWaveEmoji.classList.add('waving');
                        document.getElementById('wave-reaction-btn').click();
                        setTimeout(() => {
                            syncWaveCount();
                            if (localStorage.getItem(storageKey) === 'true') stickyWaveBtn.classList.add('waved');
                        }, 500);
                    });

                    document.getElementById('sticky-share-whatsapp').addEventListener('click', () => {
                        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + postUrl)}`, '_blank');
                    });
                    document.getElementById('sticky-share-linkedin').addEventListener('click', () => {
                        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`, '_blank');
                    });
                    document.getElementById('sticky-share-x').addEventListener('click', () => {
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`, '_blank');
                    });
                    document.getElementById('sticky-share-bluesky').addEventListener('click', () => {
                        window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(shareText + '\n' + postUrl)}`, '_blank');
                    });
                    document.getElementById('sticky-share-copy').addEventListener('click', async (e) => {
                        const btn = e.currentTarget;
                        try {
                            await navigator.clipboard.writeText(postUrl);
                            btn.classList.add('copied');
                            setTimeout(() => btn.classList.remove('copied'), 2000);
                        } catch (err) {
                            const ta = document.createElement('textarea');
                            ta.value = postUrl;
                            ta.style.cssText = 'position:fixed;left:-999999px';
                            document.body.appendChild(ta);
                            ta.select();
                            document.execCommand('copy');
                            document.body.removeChild(ta);
                            btn.classList.add('copied');
                            setTimeout(() => btn.classList.remove('copied'), 2000);
                        }
                    });

                    window.addEventListener('scroll', () => {
                        if (window.scrollY > 200) {
                            stickyFooter.classList.add('visible');
                        } else {
                            stickyFooter.classList.remove('visible');
                        }
                    }, { passive: true });
                })();
            } else {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('not-found').style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading post:', error);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('not-found').style.display = 'block';
        }
    })();
})();
