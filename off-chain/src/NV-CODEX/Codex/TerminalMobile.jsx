import React, { useRef, useEffect } from 'react';
import './TerminalMobile.css';

const TerminalMobile = ({ content, isTyping, onContinue, disabled, currentSceneImage }) => {
    const preRef = useRef(null);

    useEffect(() => {
        if (preRef.current) {
            preRef.current.scrollTop = preRef.current.scrollHeight;
        }
    }, [content]);

    return (
        <div 
            className="nv-terminal-mobile"
            style={currentSceneImage ? {
                backgroundImage: `url(${currentSceneImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            } : {}}
        >
            <pre ref={preRef}>{content}</pre>
            {isTyping && <span className="cursor-mobile">|</span>}
            <button 
                className="nv-terminal-mobile-btn"
                onClick={onContinue}
                disabled={disabled}
            >
                Continuer
            </button>
        </div>
    );
};

export default TerminalMobile; 