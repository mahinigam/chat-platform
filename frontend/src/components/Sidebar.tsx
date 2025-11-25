import React, { useState, useRef, useEffect } from 'react';
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

const Sidebar: React.FC<SidebarProps> = ({
  rooms,
  selectedRoomId,
  onRoomSelect,
  onCreateRoom,
  className,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
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
    if (rooms.length > 0 && focusedIndex === -1) {
      setFocusedIndex(0);
    }
  }, [rooms.length, focusedIndex]);

  return (
    <nav
      className={cn(
        'flex flex-col h-full w-full bg-mono-bg',
        'border-r border-mono-glass-border',
        className
      )}
      role="navigation"
      aria-label="Chat rooms"
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-mono-glass-border">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-base font-semibold text-mono-text truncate">
            Samvaad
          </h1>
          {onCreateRoom && (
            <button
              onClick={onCreateRoom}
              className={cn(
                'p-2 rounded-glass',
                'bg-mono-surface hover:bg-mono-surface/80',
                'border border-mono-glass-border hover:border-mono-glass-highlight',
                'text-mono-text hover:text-mono-text',
                'transition-all duration-fast ease-glass',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mono-text/50',
                'hover:translate-y-[-1px] active:scale-95',
                'min-h-[44px] min-w-[44px] flex items-center justify-center'
              )}
              aria-label="Create new room"
              title="Create new room (Ctrl+N)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Rooms List */}
      <ul
        className="flex-1 overflow-y-auto"
        role="list"
        aria-label="Chat room list"
      >
        {rooms.length === 0 ? (
          <li className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              <p className="text-mono-muted text-sm mb-3">No rooms yet</p>
              {onCreateRoom && (
                <button
                  onClick={onCreateRoom}
                  className={cn(
                    'px-3 py-2 rounded-glass text-sm',
                    'bg-mono-surface hover:bg-mono-surface/80',
                    'border border-mono-glass-border hover:border-mono-glass-highlight',
                    'text-mono-text hover:text-mono-text',
                    'transition-all duration-fast ease-glass',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mono-text/50',
                    'hover:translate-y-[-2px] active:scale-95'
                  )}
                >
                  Create one
                </button>
              )}
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
                  'w-full px-3 py-2 m-2 rounded-glass',
                  'transition-all duration-normal ease-glass',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-mono-text/50',
                  selectedRoomId === room.id
                    ? 'bg-mono-surface border border-mono-glass-highlight shadow-glass-sm'
                    : 'hover:bg-mono-surface/40 border border-transparent hover:border-mono-glass-border',
                  'active:scale-98',
                  'min-h-[56px] flex items-start gap-2'
                )}
                aria-selected={selectedRoomId === room.id}
                aria-label={cn(
                  `Room: ${room.name}`,
                  room.unread > 0 && `, ${room.unread} unread`,
                  room.snippet && `, ${room.snippet}`,
                  room.isOnline && ', online'
                )}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-10 h-10 mt-0.5">
                  {room.avatar ? (
                    <img
                      src={room.avatar}
                      alt=""
                      className="w-full h-full rounded-glass object-cover border border-mono-glass-border"
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-full h-full rounded-glass',
                        'bg-mono-surface-2 border border-mono-glass-border',
                        'flex items-center justify-center',
                        'text-mono-muted text-sm font-medium'
                      )}
                    >
                      {room.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Online indicator */}
                  {room.isOnline && (
                    <div
                      className={cn(
                        'absolute w-3 h-3 rounded-full',
                        'bg-green-400 border border-mono-bg',
                        'bottom-0 right-0 translate-x-1/2 translate-y-1/2'
                      )}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="text-sm font-medium text-mono-text truncate">
                      {room.name}
                    </h3>
                    {room.timestamp && (
                      <span className="text-xs text-mono-muted flex-shrink-0">
                        {room.timestamp}
                      </span>
                    )}
                  </div>

                  {room.snippet && (
                    <p className="text-xs text-mono-muted line-clamp-2">
                      {room.snippet}
                    </p>
                  )}
                </div>

                {/* Unread Badge */}
                {room.unread > 0 && (
                  <div
                    className={cn(
                      'flex-shrink-0 min-w-[24px] h-6',
                      'rounded-full',
                      'bg-mono-surface border border-mono-glass-highlight',
                      'flex items-center justify-center',
                      'text-xs font-semibold text-mono-text'
                    )}
                    aria-label={`${room.unread} unread messages`}
                  >
                    {room.unread > 99 ? '99+' : room.unread}
                  </div>
                )}
              </button>
            </li>
          ))
        )}
      </ul>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 border-t border-mono-glass-border flex gap-2">
        <button
          className={cn(
            'flex-1 px-3 py-2 rounded-glass text-sm',
            'bg-mono-surface hover:bg-mono-surface/80',
            'border border-mono-glass-border hover:border-mono-glass-highlight',
            'text-mono-text hover:text-mono-text',
            'transition-all duration-fast ease-glass',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mono-text/50',
            'hover:translate-y-[-1px] active:scale-95',
            'min-h-[40px]'
          )}
          aria-label="Settings"
        >
          <svg
            className="w-4 h-4 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        <button
          className={cn(
            'flex-1 px-3 py-2 rounded-glass text-sm',
            'bg-mono-surface hover:bg-mono-surface/80',
            'border border-mono-glass-border hover:border-mono-glass-highlight',
            'text-mono-text hover:text-mono-text',
            'transition-all duration-fast ease-glass',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mono-text/50',
            'hover:translate-y-[-1px] active:scale-95',
            'min-h-[40px]'
          )}
          aria-label="Profile"
        >
          <svg
            className="w-4 h-4 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>

        <button
          className={cn(
            'flex-1 px-3 py-2 rounded-glass text-sm',
            'bg-mono-surface hover:bg-mono-surface/80',
            'border border-mono-glass-border hover:border-mono-glass-highlight',
            'text-mono-muted hover:text-mono-text',
            'transition-all duration-fast ease-glass',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-mono-text/50',
            'hover:translate-y-[-1px] active:scale-95',
            'min-h-[40px]'
          )}
          aria-label="Logout"
        >
          <svg
            className="w-4 h-4 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
