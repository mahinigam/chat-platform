import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, focusElement } from '../utils/theme';

interface Room {
  id: string;
  name: string;
  avatar?: string;
  unread: number;
  snippet?: string;
  timestamp?: string;
  isOnline?: boolean;
}

interface SidebarProps {
  rooms: Room[];
  selectedRoomId?: string;
  onRoomSelect: (roomId: string) => void;
  onCreateRoom?: () => void;
  className?: string;
}

import SearchUsers from './Connect/SearchUsers';
import RequestList from './Connect/RequestList';
import CosmicLogo from './CosmicLogo';
import { MessageSquare, UserPlus, Users, LogOut, User } from 'lucide-react';
import ChromeButton from './ChromeButton';

const Sidebar: React.FC<SidebarProps> = ({
  rooms,
  selectedRoomId,
  onRoomSelect,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'search' | 'requests'>('chats');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // ... existing logic ...
    // Only relevant for chats tab, but keeping it simple for now or disabling when not in chats
    if (activeTab !== 'chats') return;

    let newIndex = index;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(index + 1, rooms.length - 1);
        setFocusedIndex(newIndex);
        setTimeout(() => focusElement(itemRefs.current[newIndex]), 0);
        break;

      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(index - 1, 0);
        setFocusedIndex(newIndex);
        setTimeout(() => focusElement(itemRefs.current[newIndex]), 0);
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        onRoomSelect(rooms[index].id);
        break;

      // ... keep Home/End ...
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        setTimeout(() => focusElement(itemRefs.current[0]), 0);
        break;

      case 'End':
        e.preventDefault();
        newIndex = rooms.length - 1;
        setFocusedIndex(newIndex);
        setTimeout(() => focusElement(itemRefs.current[newIndex]), 0);
        break;
    }
  };

  // Initialize focus to first room
  useEffect(() => {
    if (activeTab === 'chats' && rooms.length > 0 && focusedIndex === -1) {
      setFocusedIndex(0);
    }
  }, [rooms.length, focusedIndex, activeTab]);

  return (
    <nav
      className={cn(
        'flex flex-col h-full w-full bg-mono-bg',
        'border-r border-mono-glass-border',
        className
      )}
      role="navigation"
      aria-label="Sidebar"
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-mono-glass-border">
        <div className="flex items-center justify-between gap-2 mb-4">
          <CosmicLogo size="sm" />
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-[#2a2a2c] rounded-2xl">
          <button
            onClick={() => setActiveTab('chats')}
            className={cn(
              'flex-1 flex items-center justify-center py-1.5 px-4 rounded-xl text-xs font-medium transition-all duration-200 z-10',
              activeTab === 'chats'
                ? 'bg-[#1a1a1c] text-mono-text shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
                : 'text-mono-muted hover:text-mono-text'
            )}
            title="Chats"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={cn(
              'flex-1 flex items-center justify-center py-1.5 px-4 rounded-xl text-xs font-medium transition-all duration-200 z-10',
              activeTab === 'requests'
                ? 'bg-[#1a1a1c] text-mono-text shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
                : 'text-mono-muted hover:text-mono-text'
            )}
            title="Requests"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={cn(
              'flex-1 flex items-center justify-center py-1.5 px-4 rounded-xl text-xs font-medium transition-all duration-200 z-10',
              activeTab === 'search'
                ? 'bg-[#1a1a1c] text-mono-text shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
                : 'text-mono-muted hover:text-mono-text'
            )}
            title="Find Users"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'chats' && (
            <motion.div
              key="chats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              <ul role="list" aria-label="Chat room list" className="h-full">
                {rooms.length === 0 ? (
                  <li className="flex items-center justify-center h-full p-4">
                    <div className="text-center">
                      <p className="text-mono-muted text-sm mb-3">No chats yet</p>
                      <button
                        onClick={() => setActiveTab('search')}
                        className="text-accent-primary hover:text-accent-primary-hover text-sm font-medium"
                      >
                        Find someone to chat with
                      </button>
                    </div>
                  </li>
                ) : (
                  rooms.map((room, index) => (
                    <li key={room.id} role="listitem">
                      <button
                        ref={(el) => {
                          itemRefs.current[index] = el;
                        }}
                        onClick={() => onRoomSelect(room.id)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={() => setFocusedIndex(index)}
                        className={cn(
                          'w-[calc(100%-16px)] px-3 py-2 m-2 rounded-glass block',
                          'transition-all duration-normal ease-glass',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-mono-text/50',
                          selectedRoomId === room.id
                            ? 'bg-mono-surface border border-mono-glass-highlight shadow-glass-sm'
                            : 'hover:bg-mono-surface/40 border border-transparent hover:border-mono-glass-border',
                          'active:scale-98',
                          'min-h-[64px] flex items-center gap-3'
                        )}
                        aria-selected={selectedRoomId === room.id}
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-12 h-12 relative">
                          {room.avatar ? (
                            <img
                              src={room.avatar}
                              alt=""
                              className="w-full h-full rounded-full object-cover border border-mono-glass-border"
                            />
                          ) : (
                            <div
                              className={cn(
                                'w-full h-full rounded-full',
                                'bg-gradient-to-br from-mono-surface-2 to-mono-glass-highlight',
                                'border border-mono-glass-border shadow-glass-inner',
                                'flex items-center justify-center',
                                'text-mono-text text-lg font-medium tracking-wide'
                              )}
                            >
                              {room.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          {/* Online indicator */}
                          {room.isOnline && (
                            <div
                              className={cn(
                                'absolute w-3.5 h-3.5 rounded-full',
                                'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]',
                                'bottom-0 right-0 animate-pulse-subtle'
                              )}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3 className="text-sm font-semibold text-mono-text truncate">
                              {room.name}
                            </h3>
                            {room.timestamp && (
                              <span className="text-[10px] text-mono-muted flex-shrink-0 ml-1">
                                {room.timestamp}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <p className={cn(
                              "text-xs truncate max-w-[140px]",
                              room.unread > 0 ? "text-mono-text font-medium" : "text-mono-muted"
                            )}>
                              {room.snippet || 'Start chatting...'}
                            </p>
                            {room.unread > 0 && (
                              <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-white text-black text-[10px] font-bold px-1 shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                                {room.unread > 99 ? '99+' : room.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </motion.div>
          )}

          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              <SearchUsers />
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              <RequestList />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Profile */}
      <div className="flex-shrink-0 p-3 border-t border-mono-glass-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-mono-surface-2 flex items-center justify-center text-mono-muted">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-mono-text truncate">My Profile</p>
            <p className="text-[10px] text-mono-muted truncate">Online</p>
          </div>
          <ChromeButton
            variant="circle"
            className="p-2 min-h-[32px] min-w-[32px] flex items-center justify-center text-mono-muted hover:text-red-400"
            title="Logout"
            onClick={() => {
              localStorage.removeItem('token');
              window.location.reload();
            }}
          >
            <LogOut className="w-4 h-4" />
          </ChromeButton>
        </div>
      </div>
    </nav>
  );
};

// End of component
export default Sidebar;
