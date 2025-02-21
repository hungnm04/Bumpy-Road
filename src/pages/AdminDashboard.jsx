import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import { GiMountaintop } from "react-icons/gi";
import { FiSearch, FiUsers, FiMap, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { MdLogout } from "react-icons/md";
import { fetchWithAuth } from "../../server/utils/fetchWithAuth";
import AddLocationForm from "../components/AddLocationForm";
import EditLocationForm from "../components/EditLocationForm";
import AddUserForm from "../components/AddUserForm";
import EditUserForm from "../components/EditUserForm";
import NotificationPopover from "../components/NotificationPopover";

const AdminDashboard = () => {
  const [selectedNav, setSelectedNav] = useState("overview");
  const [totalLocations, setTotalLocations] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [mountains, setMountains] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedMountain, setSelectedMountain] = useState(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showEditUserForm, setShowEditUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerms, setSearchTerms] = useState({ mountains: "", users: "" });
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetchWithAuth("http://localhost:5000/logout", {
        method: "POST",
      });
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      setError("Logout failed. Please try again.");
    }
  };

  const stats = [
    {
      title: "Total Locations",
      value: totalLocations,
      icon: <GiMountaintop />,
    },
    {
      title: "Active Users",
      value: activeUsers,
      icon: <FiUsers />,
    },
  ];

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Total Locations
        const totalResponse = await fetchWithAuth("http://localhost:5000/admin/total-locations");
        if (totalResponse.ok) {
          const totalData = await totalResponse.json();
          setTotalLocations(totalData.totalLocations);
        } else {
          const errorData = await totalResponse.json();
          throw new Error(errorData.message || "Failed to fetch total locations");
        }

        // Fetch Active Users
        const activeResponse = await fetchWithAuth("http://localhost:5000/admin/active-users");
        if (activeResponse.ok) {
          const activeData = await activeResponse.json();
          setActiveUsers(activeData.activeUsers);
        } else {
          const errorData = await activeResponse.json();
          throw new Error(errorData.message || "Failed to fetch active users");
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedNav === "locations") {
        setLoading(true);
        setError(null);
        try {
          const response = await fetchWithAuth("http://localhost:5000/admin/mountains");
          if (response.ok) {
            const data = await response.json();
            setMountains(data.mountains);
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch mountains");
          }
        } catch (error) {
          console.error("Error fetching mountains:", error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      } else if (selectedNav === "users") {
        setLoading(true);
        setError(null);
        try {
          const response = await fetchWithAuth("http://localhost:5000/admin/users");
          if (response.ok) {
            const data = await response.json();
            setUsers(data.users);
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch users");
          }
        } catch (error) {
          console.error("Error fetching users:", error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [selectedNav]);

  const handleLocationAdded = async () => {
    // Refresh the mountains list
    const response = await fetchWithAuth("http://localhost:5000/admin/mountains");
    if (response.ok) {
      const data = await response.json();
      setMountains(data.mountains);
    }
  };

  const handleEdit = (mountain) => {
    setSelectedMountain(mountain);
    setShowEditForm(true);
  };

  const handleDelete = async (mountainId) => {
    if (window.confirm("Are you sure you want to delete this mountain?")) {
      try {
        const response = await fetchWithAuth(
          `http://localhost:5000/admin/mountains/${mountainId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          // Refresh mountains list
          handleLocationAdded();
        } else {
          throw new Error("Failed to delete mountain");
        }
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleUserAdded = async () => {
    try {
      const response = await fetchWithAuth("http://localhost:5000/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error refreshing users:", error);
      setError(error.message);
    }
  };

  const handleDeleteUser = async (username) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetchWithAuth(`http://localhost:5000/admin/users/${username}`, {
          method: "DELETE",
        });

        if (response.ok) {
          handleUserAdded(); // Refresh users list
        } else {
          throw new Error("Failed to delete user");
        }
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const getFilteredData = () => {
    const filteredMountains = mountains.filter(
      (mountain) =>
        !searchTerms.mountains ||
        mountain.name.toLowerCase().includes(searchTerms.mountains.toLowerCase()) ||
        mountain.location.toLowerCase().includes(searchTerms.mountains.toLowerCase()) ||
        mountain.continent.toLowerCase().includes(searchTerms.mountains.toLowerCase())
    );

    const filteredUsers = users.filter(
      (user) =>
        !searchTerms.users ||
        user.username.toLowerCase().includes(searchTerms.users.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerms.users.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`
          .toLowerCase()
          .includes(searchTerms.users.toLowerCase())
    );

    return { filteredMountains, filteredUsers };
  };

  const renderSearchBar = () => (
    <div className="admin-search-bar">
      <FiSearch />
      <input
        type="text"
        placeholder={`Search ${selectedNav === "locations" ? "mountains" : selectedNav === "users" ? "users" : ""}...`}
        className="admin-search-input"
        value={searchTerms[selectedNav === "locations" ? "mountains" : "users"]}
        onChange={(e) =>
          setSearchTerms((prev) => ({
            ...prev,
            [selectedNav === "locations" ? "mountains" : "users"]: e.target.value,
          }))
        }
        disabled={selectedNav === "overview"}
      />
      {searchTerms[selectedNav === "locations" ? "mountains" : "users"] && (
        <button
          className="admin-search-clear"
          onClick={() =>
            setSearchTerms((prev) => ({
              ...prev,
              [selectedNav === "locations" ? "mountains" : "users"]: "",
            }))
          }
        >
          ×
        </button>
      )}
    </div>
  );

  const { filteredMountains, filteredUsers } = getFilteredData();

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-logo-container">
          <img
            src="https://img.icons8.com/color/48/000000/mountain.png"
            alt="Mountain Explorer Logo"
            className="admin-logo"
          />
          <span className="admin-brand-name">Mountain Explorer</span>
        </div>

        <nav className="admin-nav-menu">
          <div
            className={`admin-nav-item ${selectedNav === "overview" ? "active" : ""}`}
            onClick={() => setSelectedNav("overview")}
          >
            <GiMountaintop className="admin-nav-icon" />
            <span>Overview</span>
          </div>
          <div
            className={`admin-nav-item ${selectedNav === "locations" ? "active" : ""}`}
            onClick={() => setSelectedNav("locations")}
          >
            <FiMap className="admin-nav-icon" />
            <span>Locations</span>
          </div>
          <div
            className={`admin-nav-item ${selectedNav === "users" ? "active" : ""}`}
            onClick={() => setSelectedNav("users")}
          >
            <FiUsers className="admin-nav-icon" />
            <span>Users</span>
          </div>
          {/* Remove Settings nav item */}
        </nav>
      </div>

      {/* Main Content */}
      <div className="admin-main-content">
        <header className="admin-header">
          {renderSearchBar()}
          <div className="admin-user-actions">
            <NotificationPopover />
            <img src="https://i.pravatar.cc/150?img=12" alt="Admin" className="admin-user-avatar" />
            <button className="admin-logout-button" onClick={handleLogout}>
              <MdLogout style={{ marginRight: "5px" }} />
              Logout
            </button>
          </div>
        </header>

        {/* Error Message */}
        {error && <div className="admin-error-message">{error}</div>}

        {/* Loading Spinner */}
        {loading ? (
          <div className="admin-loading">Loading...</div>
        ) : (
          <>
            {/* Overview View */}
            {selectedNav === "overview" && (
              <div className="admin-dashboard-grid">
                {stats.map((stat, index) => (
                  <div key={index} className="admin-stats-card">
                    <div className="admin-stats-header">
                      <span className="admin-stats-title">{stat.title}</span>
                      <span className="admin-stats-icon">{stat.icon}</span>
                    </div>
                    <div className="admin-stats-value">{stat.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Locations View */}
            {selectedNav === "locations" && (
              <div className="admin-locations-table">
                <div className="admin-table-header">
                  <h2>Mountain Locations</h2>
                  <button className="admin-add-location-btn" onClick={() => setShowAddForm(true)}>
                    <FiPlus />
                    Add Location
                  </button>
                </div>

                {showAddForm && (
                  <AddLocationForm
                    onClose={() => setShowAddForm(false)}
                    onLocationAdded={handleLocationAdded}
                  />
                )}

                {showEditForm && selectedMountain && (
                  <EditLocationForm
                    mountainId={selectedMountain.id}
                    onClose={() => {
                      setShowEditForm(false);
                      setSelectedMountain(null);
                    }}
                    onLocationUpdated={handleLocationAdded}
                  />
                )}

                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Location</th>
                      <th>Continent</th>
                      <th>Created</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMountains.length > 0 ? (
                      filteredMountains.map((mountain) => (
                        <tr key={mountain.id}>
                          <td>
                            <img
                              src={`/src/assets/mountain_photos/${mountain.photo_url}`}
                              alt={mountain.name}
                              className="mountain-small-image"
                              onError={(e) => {
                                e.target.src = "/src/assets/placeholder-mountain.png";
                                e.target.onerror = null;
                              }}
                            />
                          </td>
                          <td>{mountain.name}</td>
                          <td className="description-cell">
                            {mountain.description.length > 100
                              ? `${mountain.description.substring(0, 100)}...`
                              : mountain.description}
                          </td>
                          <td>{mountain.location}</td>
                          <td>{mountain.continent}</td>
                          <td>{new Date(mountain.created_at).toLocaleDateString()}</td>
                          <td>{new Date(mountain.updated_at).toLocaleDateString()}</td>
                          <td>
                            <div className="admin-action-buttons">
                              <button
                                className="admin-edit-btn"
                                onClick={() => handleEdit(mountain)}
                              >
                                <FiEdit2 /> Edit
                              </button>
                              <button
                                className="admin-delete-btn"
                                onClick={() => handleDelete(mountain.id)}
                              >
                                <FiTrash2 /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center" }}>
                          {searchTerms.mountains
                            ? "No mountains found matching your search."
                            : "No mountain locations found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Users View */}
            {selectedNav === "users" && (
              <div className="admin-users-table">
                <div className="admin-table-header">
                  <h2>Users</h2>
                  <button className="admin-add-user-btn" onClick={() => setShowAddUserForm(true)}>
                    <FiPlus />
                    Add User
                  </button>
                </div>

                {showAddUserForm && (
                  <AddUserForm
                    onClose={() => setShowAddUserForm(false)}
                    onUserAdded={handleUserAdded}
                  />
                )}

                {showEditUserForm && selectedUser && (
                  <EditUserForm
                    userId={selectedUser.username}
                    onClose={() => {
                      setShowEditUserForm(false);
                      setSelectedUser(null);
                    }}
                    onUserUpdated={handleUserAdded}
                  />
                )}

                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Joined Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.username}>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>{user.first_name}</td>
                          <td>{user.last_name}</td>
                          <td>{new Date(user.created_at).toLocaleDateString()}</td>
                          <td>
                            <div className="admin-action-buttons">
                              <button
                                className="admin-edit-btn"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowEditUserForm(true);
                                }}
                              >
                                <FiEdit2 /> Edit
                              </button>
                              <button
                                className="admin-delete-btn"
                                onClick={() => handleDeleteUser(user.username)}
                              >
                                <FiTrash2 /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center" }}>
                          {searchTerms.users
                            ? "No users found matching your search."
                            : "No users found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {/* Remove Settings View */}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
