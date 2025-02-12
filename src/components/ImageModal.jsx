import React from "react";
import "./ImageModalStyles.css";

const ImageModal = ({ imageUrl, onClose }) => {
  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content">
        <img
          src={imageUrl}
          alt="Full size"
          onClick={(e) => e.stopPropagation()}
        />
        <button className="modal-close-button" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default ImageModal;
