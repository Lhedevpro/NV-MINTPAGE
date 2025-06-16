import React, { useRef, useEffect } from 'react';
import './Terminal.css';

const Terminal = ({ content, isTyping, onContinue, disabled, currentSceneImage }) => {
    const preRef = useRef(null);

    useEffect(() => {
        if (preRef.current) {
            preRef.current.scrollTop = preRef.current.scrollHeight;
        }
    }, [content]);

    return (
        <div className="terminal-frame" style={currentSceneImage ? {
            backgroundImage: `url(${currentSceneImage})`,
            backgroundSize: '95% 90%',
            marginTop: '-40px',
            backgroundPosition: '200px 15px',
            backgroundRepeat: 'no-repeat',
        } : {}}>
            <div className="nv-terminal">
                <pre ref={preRef}>{content}</pre>
                {isTyping && <span className="cursor">|</span>}
                <button 
                    className="nv-terminal-btn"
                    onClick={onContinue}
                    disabled={disabled}
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default Terminal; 