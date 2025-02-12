import React, { useState, useEffect, useRef } from "react";
import { MdNotificationsActive } from "react-icons/md";
import { io } from "socket.io-client";
import "./NotificationPopover.css";
import NotificationModal from "./NotificationModal";
import { fetchWithAuth } from "../../server/utils/fetchWithAuth";

const NotificationPopover = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const popoverRef = useRef(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io("http://localhost:5000");

    // Load initial notifications
    fetchNotifications();

    // Listen for new notifications
    newSocket.on("newNotification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Mark all as read when opening the popover
      handleMarkAllAsRead();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await fetchWithAuth(
        "http://localhost:5000/notifications/unread"
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchAllNotifications = async () => {
    try {
      const response = await fetchWithAuth(
        "http://localhost:5000/notifications/all"
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching all notifications:", error);
    }
  };

  const handleToggleView = async () => {
    setShowAll(!showAll);
    if (!showAll) {
      await fetchAllNotifications();
    } else {
      await fetchNotifications(); // Fetch only unread
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetchWithAuth("http://localhost:5000/notifications/mark-all-read", {
        method: "PUT",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      await fetchWithAuth(
        `http://localhost:5000/notifications/${notification.id}/read`,
        {
          method: "PUT",
        }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );

      // Show modal with notification details
      setSelectedNotification(notification);
      setShowModal(true);
      setIsOpen(false);
    } catch (error) {
      console.error("Error handling notification:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="notification-wrapper" ref={popoverRef}>
      <button
        className="notification-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MdNotificationsActive />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-popover">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              <button className="toggle-view-button" onClick={handleToggleView}>
                {showAll ? "Show Unread" : "Show All"}
              </button>
            </div>
          </div>
          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.is_read ? "read" : "unread"}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    <MdNotificationsActive />
                  </div>
                  <div className="notification-content">
                    <p className="notification-title">{notification.title}</p>
                    <p className="notification-preview">
                      {notification.content}
                    </p>
                    <span className="notification-time">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <p>No new notifications</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default NotificationPopover;
