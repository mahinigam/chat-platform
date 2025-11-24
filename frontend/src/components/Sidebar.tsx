import React from 'react';

interface SidebarProps {
    currentUser: any;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, onLogout }) => {
    return (
        <div className="w-[350px] h-full bg-telegram-sidebar border-r border-telegram-border flex flex-col">
            {/* Header / Search */}
            <div className="p-3 flex items-center space-x-3">
                <button
                    onClick={onLogout}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                    title="Menu / Logout"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-telegram-hover text-black px-4 py-2 pl-10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-telegram-primary/20 border border-transparent focus:border-telegram-primary transition-all"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                </div>
            </div>

            {/* Chat List (Mocked for now, can be expanded) */}
            <div className="flex-1 overflow-y-auto">
                {/* Active Chat Item */}
                <div className="px-3 py-2 bg-telegram-primary text-white cursor-pointer flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                        #
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                            <h3 className="font-medium truncate">General</h3>
                            <span className="text-xs opacity-70">12:45</span>
                        </div>
                        <p className="text-sm opacity-80 truncate">
                            <span className="font-medium">You:</span> Hello from browser
                        </p>
                    </div>
                </div>

                {/* Inactive Chat Item (Example) */}
                <div className="px-3 py-2 hover:bg-telegram-hover cursor-pointer flex items-center space-x-3 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold">
                        T
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                            <h3 className="font-medium text-black truncate">Telegram News</h3>
                            <span className="text-xs text-gray-400">Yesterday</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                            New features available now!
                        </p>
                    </div>
                </div>
            </div>

            {/* User Profile (Bottom) */}
            <div className="p-3 border-t border-telegram-border flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-telegram-primary text-white flex items-center justify-center text-sm font-bold">
                        {currentUser.username[0].toUpperCase()}
                    </div>
                    <div className="text-sm font-medium text-black">
                        {currentUser.username}
                    </div>
                </div>
                <div className="text-xs text-telegram-primary font-medium">
                    Online
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
