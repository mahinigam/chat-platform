import React from 'react';

const TypingIndicator: React.FC = () => {
    return (
        <div className="flex justify-start mb-4">
            <div className="typing-indicator">
                <div className="typing-dot" style={{ animationDelay: '0ms' }} />
                <div className="typing-dot" style={{ animationDelay: '150ms' }} />
                <div className="typing-dot" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    );
};

export default TypingIndicator;
