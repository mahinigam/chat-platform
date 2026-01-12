/**
 * Spotify Service - DISABLED for security
 * 
 * The original implementation exposed client_secret in the frontend,
 * which is visible in browser network tab. Spotify OAuth requires
 * server-side token generation for security.
 * 
 * To enable Spotify integration:
 * 1. Create a backend route: GET /api/spotify/token
 * 2. Backend handles client credentials flow
 * 3. Frontend only receives the access token
 */

export interface SpotifyTrack {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
        name: string;
        images: { url: string; height: number; width: number }[];
    };
}

// Feature disabled - returns empty results
export const getSpotifyToken = async (): Promise<string> => {
    console.warn('Spotify integration disabled for security. Implement backend token endpoint.');
    throw new Error('Spotify integration requires backend implementation');
};

export const searchSpotifyTracks = async (_query: string): Promise<SpotifyTrack[]> => {
    // Spotify search disabled for security - client_secret should not be in frontend
    return [];
};

export const resolveToYoutube = async (_track: SpotifyTrack, _youtubeKey: string): Promise<string | null> => {
    return null;
};
