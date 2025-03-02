import React from 'react';
import './MissingPoster.css';

type MissingPosterProps = {
  name: string;
  lastSeen: string;
  photoUrl: string;
};

export const MissingPoster: React.FC<MissingPosterProps> = ({
  name,
  lastSeen,
  photoUrl,
}) => {
  return (
    <div className="missing-poster">
      <div className="missing-header">
        <h1 className="missing-title">MISSING</h1>
        <h2 className="missing-subtitle">{name}</h2>
      </div>

      <div className="missing-content">
        <div className="missing-photo-area">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="missing-photo" />
          ) : (
            <div className="missing-photo-placeholder">CLEAR PHOTO</div>
          )}
        </div>
      </div>

      <div className="missing-last-seen">LAST SEEN: {lastSeen}</div>

      <div className="missing-contact">
        IF YOU HAVE ANY INFORMATION ABOUT THE {name.toUpperCase()} NOMINATIONS,<br/>PLEASE CONTACT THE ACADEMY
      </div>
    </div>
  );
};
