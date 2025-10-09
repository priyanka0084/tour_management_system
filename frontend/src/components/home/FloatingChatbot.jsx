import { useState } from 'react';
import TourChatbot from './TourChatbot'; // Adjust import path as needed

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating icon always visible, toggles open state */}
      <div
        style={{
          position: 'fixed',
          right: '32px',
          bottom: '32px',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          cursor: 'pointer'
        }}
        title={open ? "Close Tour Chatbot" : "Open Tour Chatbot"}
        onClick={() => setOpen(!open)}
      >
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M2 2v20l4-4h16V2H2zm18 14H6.83L4 18.83V4h16v12z"/>
        </svg>
      </div>

      {/* Chatbot Popup, only visible when open */}
      {open && (
        <div
          style={{
            position: 'fixed',
            right: '40px',
            bottom: '110px',
            zIndex: 10000,
            background: 'transparent', // Ensure no purple background
            boxShadow: 'none'
          }}
        >
          <div style={{
            borderRadius: '22px',
            overflow: 'hidden',
            position: 'relative',
            background: 'transparent' // Remove any child background
          }}>
            {/* Removed close button */}
            <TourChatbot />
          </div>
        </div>
      )}
    </>
  );
}
