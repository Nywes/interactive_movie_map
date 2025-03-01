import React from 'react';
import './YouTubeModal.css';

interface YouTubeModalProps {
  videoId: string | null;
  onClose: () => void;
}

export const YouTubeModal: React.FC<YouTubeModalProps> = ({ videoId, onClose }) => {
  if (!videoId) return null;

  return (
    <div className="youtube-modal-overlay" onClick={onClose}>
      <div className="youtube-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="youtube-modal-close" onClick={onClose}>
          ×
        </button>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};
