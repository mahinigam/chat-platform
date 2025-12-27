import axios from 'axios';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_SEARCH_URL = 'https://api.spotify.com/v1/search';

interface SpotifyConfig {
    clientId: string;
    clientSecret: string;
}

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

const getConfig = (): SpotifyConfig => {
    return {
        clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID || '',
        clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || ''
    };
};

export const getSpotifyToken = async (): Promise<string> => {
    const { clientId, clientSecret } = getConfig();

    // Check if we have a valid cached token
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return accessToken;
    }

    if (!clientId || !clientSecret) {
        throw new Error('Missing Spotify Credentials');
    }

    try {
        const response = await axios.post(SPOTIFY_TOKEN_URL,
            new URLSearchParams({
                'grant_type': 'client_credentials'
            }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            }
        });

        accessToken = response.data.access_token;
        // Set expiry to 55 minutes (token lasts 60)
        tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 300000;

        if (!accessToken) throw new Error('Failed to retrieve access token');

        return accessToken;
    } catch (error) {
        console.error('Spotify Auth Error:', error);
        throw error;
    }
};

export interface SpotifyTrack {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
        name: string;
        images: { url: string; height: number; width: number }[];
    };
}

export const searchSpotifyTracks = async (query: string): Promise<SpotifyTrack[]> => {
    try {
        const token = await getSpotifyToken();
        const response = await axios.get(SPOTIFY_SEARCH_URL, {
            params: {
                q: query,
                type: 'track',
                limit: 10
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data.tracks.items;
    } catch (error) {
        console.error('Spotify Search Error:', error);
        return [];
    }
};

/**
 * Bridges Spotify Track to YouTube Video
 * Searches YouTube for "Artist - Track Name official audio"
 */
export const resolveToYoutube = async (track: SpotifyTrack, youtubeKey: string): Promise<string | null> => {
    if (!youtubeKey) return null;

    // Construct a specific query to ensure music results without needing the category filter
    const query = `${track.artists[0].name} - ${track.name}`;

    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'id,snippet', // Request snippet too to debug/verify
                maxResults: 1,
                q: query,
                type: 'video',
                key: youtubeKey.trim()
            }
        });

        if (response.data.error) {
            console.error('YouTube API Error (response.data.error):', response.data.error);
            return null;
        }

        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0].id.videoId;
        }

        console.warn('YouTube Search returned 0 items for:', query);
        return null;
    } catch (error: any) {
        // Detailed error logging
        if (error.response) {
            console.error('YouTube API Error:', error.response.data);
            // If quota exceeded or forbidden, we might want to know.
        } else {
            console.error('YouTube Network Error:', error);
        }
        return null;
    }
};
