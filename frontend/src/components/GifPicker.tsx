import React, { useState, useEffect } from 'react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import { cn } from '../utils/theme';

// Use a demo key if not provided, but warn user
const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh'; // Demo key
const gf = new GiphyFetch(GIPHY_API_KEY);

interface GifPickerProps {
    onSelect: (gif: any) => void;
    onClose: () => void;
}

const GifPicker: React.FC<GifPickerProps> = ({ onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const [width, setWidth] = useState(window.innerWidth < 400 ? window.innerWidth - 40 : 350);

    const fetchGifs = (offset: number) => {
        if (search) {
            return gf.search(search, { offset, limit: 10 });
        }
        return gf.trending({ offset, limit: 10 });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-mono-surface w-full max-w-md rounded-glass border border-mono-glass-border shadow-2xl flex flex-col h-[500px] animate-fade-up">
                <div className="p-4 border-b border-mono-glass-border flex justify-between items-center">
                    <input
                        type="text"
                        placeholder="Search GIFs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={cn(
                            'flex-1 px-3 py-2 rounded-glass mr-2',
                            'bg-mono-surface-2 border border-mono-glass-border',
                            'text-mono-text placeholder-mono-muted',
                            'focus:outline-none focus:ring-2 focus:ring-mono-glass-highlight/50'
                        )}
                        autoFocus
                    />
                    <button onClick={onClose} className="text-mono-muted hover:text-mono-text">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    <Grid
                        width={width}
                        columns={3}
                        fetchGifs={fetchGifs}
                        key={search} // Force re-render on search change
                        onGifClick={(gif, e) => {
                            e.preventDefault();
                            onSelect(gif);
                        }}
                        noLink
                    />
                </div>
            </div>
        </div>
    );
};

export default GifPicker;
