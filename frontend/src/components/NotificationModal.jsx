import React, { useEffect, useRef } from "react";
import "./NotificationModal.css";
import { MdClose, MdEmail, MdSubject, MdMessage, MdAccessTime } from "react-icons/md";
import { FaUser } from "react-icons/fa";

const NotificationModal = ({ notification, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    // Add slide-in animation class after mount
    const timer = setTimeout(() => {
      if (modalRef.current) {
        modalRef.current.classList.add("show");
      }
    }, 10);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      clearTimeout(timer);
    };
  }, [onClose]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const handleReplyEmail = (data) => {
    const subject = encodeURIComponent(`Re: ${data.subject}`);
    const body = encodeURIComponent(`\n\nOriginal message from ${data.name}:\n${data.message}`);
    const mailtoLink = `mailto:${data.email}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  const renderFAQContent = (data) => {
    return (
      <div className="faq-content">
        <div className="faq-header">
          <div className="faq-sender-info">
            <FaUser className="faq-icon" />
            <span>{data.name}</span>
          </div>
          <div className="faq-time">
            <MdAccessTime className="faq-icon" />
            <span>{formatDate(notification.created_at)}</span>
          </div>
        </div>

        <div className="faq-body">
          <div className="faq-field">
            <div className="field-label">
              <MdEmail className="field-icon" />
              <strong>Contact Email</strong>
            </div>
            <span className="field-value">{data.email}</span>
          </div>

          <div className="faq-field">
            <div className="field-label">
              <MdSubject className="field-icon" />
              <strong>Subject</strong>
            </div>
            <span className="field-value">{data.subject}</span>
          </div>

          <div className="faq-field">
            <div className="field-label">
              <MdMessage className="field-icon" />
              <strong>Message</strong>
            </div>
            <p className="message-content">{data.message}</p>
          </div>
        </div>

        <div className="faq-actions">
          <button className="action-button reply-button" onClick={() => handleReplyEmail(data)}>
            <MdEmail className="button-icon" />
            Reply via Email
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="notification-modal" ref={modalRef}>
        <div className="modal-header">
          <h2>{notification.title}</h2>
          <button className="close-button" onClick={onClose}>
            <MdClose />
          </button>
        </div>
        <div className="modal-content">
          {notification.type === "FAQ" && renderFAQContent(notification.data)}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
