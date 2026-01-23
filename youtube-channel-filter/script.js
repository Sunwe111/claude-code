// YouTube API Configuration
const API_KEY = 'AIzaSyBfHB3j8MSYlZ2jALaMdl3Kc7PK4uNCAJo';
const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// State
let allVideos = [];
let filteredVideos = [];
let currentChannel = null;

// DOM Elements
const channelUrlInput = document.getElementById('channelUrl');
const loadChannelBtn = document.getElementById('loadChannel');
const channelInfo = document.getElementById('channelInfo');
const channelThumbnail = document.getElementById('channelThumbnail');
const channelTitle = document.getElementById('channelTitle');
const channelStats = document.getElementById('channelStats');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const videoCount = document.getElementById('videoCount');
const videosGrid = document.getElementById('videosGrid');
const themeToggle = document.getElementById('themeToggle');
const resetFiltersBtn = document.getElementById('resetFilters');

// Filter Elements
const viewsMinInput = document.getElementById('viewsMinInput');
const viewsMaxInput = document.getElementById('viewsMaxInput');
const timeFilter = document.getElementById('timeFilter');
const minComments = document.getElementById('minComments');
const keywordSearch = document.getElementById('keywordSearch');
const sortBy = document.getElementById('sortBy');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Load Channel
    loadChannelBtn.addEventListener('click', loadChannel);
    channelUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadChannel();
    });

    // Views Input Fields
    viewsMinInput.addEventListener('input', applyFilters);
    viewsMaxInput.addEventListener('input', applyFilters);

    // Other Filters
    timeFilter.addEventListener('change', applyFilters);
    minComments.addEventListener('input', applyFilters);
    keywordSearch.addEventListener('input', applyFilters);
    sortBy.addEventListener('change', applyFilters);

    // Duration Checkboxes
    document.querySelectorAll('.filter-content input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    // Reset Filters
    resetFiltersBtn.addEventListener('click', resetFilters);

    // Collapsible Sections
    document.querySelectorAll('.filter-title').forEach(title => {
        title.addEventListener('click', () => {
            const content = title.nextElementSibling;
            const icon = title.querySelector('.dropdown-icon');

            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.style.transform = 'rotate(0deg)';
            } else {
                content.style.display = 'none';
                icon.style.transform = 'rotate(-90deg)';
            }
        });
    });
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

function resetFilters() {
    viewsMinInput.value = 0;
    viewsMaxInput.value = 999999999;
    timeFilter.value = '30';
    minComments.value = 0;
    keywordSearch.value = '';
    sortBy.value = 'views-desc';

    document.querySelectorAll('.filter-content input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
    });

    applyFilters();
}

async function loadChannel() {
    const input = channelUrlInput.value.trim();
    if (!input) {
        alert('Prosím zadaj URL alebo ID kanála');
        return;
    }

    loading.style.display = 'block';
    channelInfo.style.display = 'none';
    results.style.display = 'none';
    videosGrid.innerHTML = '';
    allVideos = [];

    try {
        // Extract channel identifier
        const { type, value } = extractChannelId(input);
        console.log('Extracted:', { type, value });
        let channelId = null;

        // If it's a handle/username, search for the channel first
        if (type === 'handle' || type === 'username') {
            const searchQuery = type === 'handle' ? value : value;
            const searchUrl = `${API_BASE_URL}/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&key=${API_KEY}&maxResults=1`;
            console.log('Searching for channel:', searchUrl);

            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();
            console.log('Search response:', searchData);

            if (searchData.error) {
                throw new Error(`API Error: ${searchData.error.message}`);
            }

            if (!searchData.items || searchData.items.length === 0) {
                throw new Error('Kanál nenájdený. Skús použiť priamy channel ID.');
            }

            channelId = searchData.items[0].id.channelId;
            console.log('Found channel ID:', channelId);
        } else {
            // It's already a channel ID
            channelId = value;
            console.log('Using direct channel ID:', channelId);
        }

        // Fetch Channel Info
        const channelUrl = `${API_BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${API_KEY}`;
        console.log('Fetching channel info:', channelUrl);

        const channelResponse = await fetch(channelUrl);
        const channelData = await channelResponse.json();
        console.log('Channel response:', channelData);

        if (channelData.error) {
            throw new Error(`API Error: ${channelData.error.message}`);
        }

        if (!channelData.items || channelData.items.length === 0) {
            throw new Error('Kanál nenájdený. Overte že URL je správne.');
        }

        currentChannel = channelData.items[0];
        displayChannelInfo(currentChannel);

        // Fetch Videos
        await fetchAllVideos(channelId);

        loading.style.display = 'none';
        results.style.display = 'block';

        applyFilters();
    } catch (error) {
        console.error('Error details:', error);
        loading.style.display = 'none';
        alert('Chyba pri načítavaní kanála: ' + error.message);
    }
}

function extractChannelId(input) {
    // Direct channel ID
    if (input.match(/^UC[\w-]{22}$/)) {
        return { type: 'channelId', value: input };
    }

    // Channel URL with ID
    const channelIdMatch = input.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
    if (channelIdMatch) {
        return { type: 'channelId', value: channelIdMatch[1] };
    }

    // @handle format
    const handleMatch = input.match(/youtube\.com\/@([\w-]+)/);
    if (handleMatch) {
        return { type: 'handle', value: handleMatch[1] };
    }

    // /c/ custom URL
    const customMatch = input.match(/youtube\.com\/c\/([\w-]+)/);
    if (customMatch) {
        return { type: 'username', value: customMatch[1] };
    }

    // /user/ username
    const userMatch = input.match(/youtube\.com\/user\/([\w-]+)/);
    if (userMatch) {
        return { type: 'username', value: userMatch[1] };
    }

    // If starts with @, treat as handle
    if (input.startsWith('@')) {
        return { type: 'handle', value: input.substring(1) };
    }

    // Try to use it as a handle/username
    return { type: 'username', value: input };
}

async function fetchAllVideos(channelId) {
    let nextPageToken = null;
    const maxResults = 50;

    do {
        const url = `${API_BASE_URL}/search?key=${API_KEY}&channelId=${channelId}&part=snippet&type=video&maxResults=${maxResults}&order=date${nextPageToken ? '&pageToken=' + nextPageToken : ''}`;
        console.log('Fetching videos:', url);

        const response = await fetch(url);
        const data = await response.json();
        console.log('Videos response:', data);

        if (data.error) {
            throw new Error(`API Error: ${data.error.message}`);
        }

        if (!data.items) break;

        const videoIds = data.items.map(item => item.id.videoId).join(',');

        // Fetch detailed video statistics
        const statsResponse = await fetch(
            `${API_BASE_URL}/videos?part=statistics,contentDetails&id=${videoIds}&key=${API_KEY}`
        );
        const statsData = await statsResponse.json();

        // Combine search results with statistics
        const videos = data.items.map(item => {
            const stats = statsData.items.find(v => v.id === item.id.videoId);
            return {
                id: item.id.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.high.url,
                publishedAt: new Date(item.snippet.publishedAt),
                views: parseInt(stats?.statistics?.viewCount || 0),
                likes: parseInt(stats?.statistics?.likeCount || 0),
                comments: parseInt(stats?.statistics?.commentCount || 0),
                duration: parseDuration(stats?.contentDetails?.duration || 'PT0S')
            };
        });

        allVideos = [...allVideos, ...videos];
        nextPageToken = data.nextPageToken;

        // Limit to reasonable number to avoid quota issues
        if (allVideos.length >= 200) break;

    } while (nextPageToken);
}

function parseDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function displayChannelInfo(channel) {
    channelThumbnail.src = channel.snippet.thumbnails.high.url;
    channelTitle.textContent = channel.snippet.title;

    const subscriberCount = parseInt(channel.statistics.subscriberCount).toLocaleString();
    const videoCount = parseInt(channel.statistics.videoCount).toLocaleString();

    channelStats.textContent = `${subscriberCount} odberateľov • ${videoCount} videí`;
    channelInfo.style.display = 'flex';
}

function applyFilters() {
    if (allVideos.length === 0) return;

    console.log('Applying filters...');

    filteredVideos = allVideos.filter(video => {
        // Views Filter
        const minViews = parseInt(viewsMinInput.value) || 0;
        const maxViews = parseInt(viewsMaxInput.value) || 999999999;

        console.log(`Video: ${video.title}, Views: ${video.views}, Min: ${minViews}, Max: ${maxViews}`);

        if (video.views < minViews || video.views > maxViews) {
            console.log(`Filtered out by views: ${video.title}`);
            return false;
        }

        // Time Filter
        const daysAgo = parseInt(timeFilter.value);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        if (video.publishedAt < cutoffDate) return false;

        // Duration Filter
        const selectedDurations = [];
        document.querySelectorAll('.filter-content input[type="checkbox"]:checked').forEach(checkbox => {
            selectedDurations.push(checkbox.value);
        });

        if (selectedDurations.length > 0) {
            let matchesDuration = false;

            if (selectedDurations.includes('short') && video.duration < 60) matchesDuration = true;
            if (selectedDurations.includes('medium-short') && video.duration >= 60 && video.duration < 300) matchesDuration = true;
            if (selectedDurations.includes('medium') && video.duration >= 300 && video.duration < 1200) matchesDuration = true;
            if (selectedDurations.includes('long') && video.duration >= 1200 && video.duration < 3600) matchesDuration = true;
            if (selectedDurations.includes('extra-long') && video.duration >= 3600) matchesDuration = true;

            if (!matchesDuration) return false;
        }

        // Comments Filter
        const minCommentsValue = parseInt(minComments.value) || 0;
        if (video.comments < minCommentsValue) return false;

        // Keyword Search
        const keyword = keywordSearch.value.toLowerCase().trim();
        if (keyword && !video.title.toLowerCase().includes(keyword)) return false;

        return true;
    });

    // Sort
    const sortValue = sortBy.value;
    filteredVideos.sort((a, b) => {
        switch (sortValue) {
            case 'views-desc':
                return b.views - a.views;
            case 'views-asc':
                return a.views - b.views;
            case 'date-desc':
                return b.publishedAt - a.publishedAt;
            case 'date-asc':
                return a.publishedAt - b.publishedAt;
            case 'duration-desc':
                return b.duration - a.duration;
            case 'duration-asc':
                return a.duration - b.duration;
            default:
                return 0;
        }
    });

    displayVideos();
}

function displayVideos() {
    videoCount.textContent = filteredVideos.length;
    videosGrid.innerHTML = '';

    filteredVideos.forEach(video => {
        const card = createVideoCard(video);
        videosGrid.appendChild(card);
    });
}

function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.onclick = () => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank');

    const timeAgo = getTimeAgo(video.publishedAt);

    card.innerHTML = `
        <div class="video-thumbnail">
            <img src="${video.thumbnail}" alt="${video.title}">
            <div class="video-duration">${formatDuration(video.duration)}</div>
        </div>
        <div class="video-info">
            <div class="video-title">${video.title}</div>
            <div class="video-stats">
                <div class="video-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    ${formatNumber(video.views)}
                </div>
                <div class="video-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    ${formatNumber(video.comments)}
                </div>
            </div>
            <div class="video-date">${timeAgo}</div>
        </div>
    `;

    return card;
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = {
        rok: 31536000,
        mesiac: 2592000,
        týždeň: 604800,
        deň: 86400,
        hodina: 3600,
        minúta: 60
    };

    for (const [name, secondsInInterval] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInInterval);
        if (interval >= 1) {
            if (interval === 1) {
                return `pred 1 ${name}${name === 'mesiac' ? 'om' : name === 'rok' ? 'om' : name === 'týždeň' ? 'ňom' : name === 'deň' ? 'ňom' : 'ou'}`;
            }

            let suffix = 'mi';
            if (name === 'rok') {
                suffix = interval < 5 ? 'y' : 'mi';
            } else if (name === 'mesiac') {
                suffix = interval < 5 ? 'e' : 'mi';
            } else if (name === 'deň') {
                suffix = interval < 5 ? 'ni' : 'mi';
            } else if (name === 'týždeň') {
                suffix = interval < 5 ? 'ne' : 'mi';
            } else if (name === 'hodina') {
                suffix = interval < 5 ? 'y' : 'mi';
            } else if (name === 'minúta') {
                suffix = interval < 5 ? 'y' : 'mi';
            }

            return `pred ${interval} ${name}${suffix}`;
        }
    }

    return 'pred chvíľou';
}
