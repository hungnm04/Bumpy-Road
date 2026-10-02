import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import { GiMountaintop } from "react-icons/gi";
import {
  FiCheck,
  FiDownloadCloud,
  FiEdit2,
  FiExternalLink,
  FiMap,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
  FiFileText,
} from "react-icons/fi";
import { MdLogout } from "react-icons/md";
import { fetchWithAuth } from "../api/fetchWithAuth";
import { FALLBACK_MOUNTAIN_IMAGE, getMountainImageUrl } from "../api/assetUrls";
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
  const [ingestionCandidates, setIngestionCandidates] = useState([]);
  const [ingestionRuns, setIngestionRuns] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedMountain, setSelectedMountain] = useState(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showEditUserForm, setShowEditUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerms, setSearchTerms] = useState({ mountains: "", users: "", imports: "" });
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetchWithAuth("/logout", {
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
        const totalResponse = await fetchWithAuth("/admin/total-locations");
        if (totalResponse.ok) {
          const totalData = await totalResponse.json();
          setTotalLocations(totalData.totalLocations);
        } else {
          const errorData = await totalResponse.json();
          throw new Error(errorData.message || "Failed to fetch total locations");
        }

        // Fetch Active Users
        const activeResponse = await fetchWithAuth("/admin/active-users");
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
          const response = await fetchWithAuth("/admin/mountains");
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
          const response = await fetchWithAuth("/admin/users");
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
      } else if (selectedNav === "imports") {
        setLoading(true);
        setError(null);
        try {
          const [candidateResponse, runResponse] = await Promise.all([
            fetchWithAuth("/admin/ingestion/candidates?status=draft"),
            fetchWithAuth("/admin/ingestion/runs"),
          ]);

          if (!candidateResponse.ok || !runResponse.ok) {
            throw new Error("Failed to fetch ingestion review data");
          }

          const [candidateData, runData] = await Promise.all([
            candidateResponse.json(),
            runResponse.json(),
          ]);
          setIngestionCandidates(candidateData.candidates);
          setIngestionRuns(runData.runs);
          setSelectedCandidateIds([]);
        } catch (error) {
          console.error("Error fetching ingestion review data:", error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      } else if (selectedNav === "audit") {
        setLoading(true);
        setError(null);
        try {
          const response = await fetchWithAuth("/admin/audit-log?limit=50");
          if (!response.ok) throw new Error("Failed to fetch audit log");
          const data = await response.json();
          setAuditLog(data.entries || []);
        } catch (error) {
          console.error("Error fetching audit log:", error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [selectedNav]);

  const loadImports = async () => {
    const [candidateResponse, runResponse] = await Promise.all([
      fetchWithAuth("/admin/ingestion/candidates?status=draft"),
      fetchWithAuth("/admin/ingestion/runs"),
    ]);

    if (!candidateResponse.ok || !runResponse.ok) {
      throw new Error("Failed to refresh ingestion review data");
    }

    const [candidateData, runData] = await Promise.all([
      candidateResponse.json(),
      runResponse.json(),
    ]);
    setIngestionCandidates(candidateData.candidates);
    setIngestionRuns(runData.runs);
    setSelectedCandidateIds([]);
  };

  const handleLocationAdded = async () => {
    // Refresh the mountains list
    const response = await fetchWithAuth("/admin/mountains");
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
          `/admin/mountains/${mountainId}`,
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
      const response = await fetchWithAuth("/admin/users");
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
        const response = await fetchWithAuth(`/admin/users/${username}`, {
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

  const handleCandidateStatus = async (candidateId, action) => {
    try {
      const response = await fetchWithAuth(`/admin/ingestion/candidates/${candidateId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error(`Failed to ${action} destination`);
      await loadImports();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleBulkPublish = async () => {
    try {
      const response = await fetchWithAuth("/admin/ingestion/candidates/bulk-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedCandidateIds }),
      });

      if (!response.ok) throw new Error("Failed to publish selected destinations");
      await loadImports();
    } catch (error) {
      setError(error.message);
    }
  };

  const toggleCandidate = (candidateId) => {
    setSelectedCandidateIds((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId]
    );
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

    const filteredCandidates = ingestionCandidates.filter(
      (candidate) =>
        !searchTerms.imports ||
        candidate.name.toLowerCase().includes(searchTerms.imports.toLowerCase()) ||
        candidate.location.toLowerCase().includes(searchTerms.imports.toLowerCase()) ||
        (candidate.region || "").toLowerCase().includes(searchTerms.imports.toLowerCase())
    );

    return { filteredMountains, filteredUsers, filteredCandidates };
  };

  const searchKey = selectedNav === "locations"
    ? "mountains"
    : selectedNav === "imports"
      ? "imports"
      : "users";

  const renderSearchBar = () => (
    <div className="admin-search-bar">
      <FiSearch />
      <input
        type="text"
        placeholder={`Search ${selectedNav === "locations" ? "mountains" : selectedNav === "imports" ? "imports" : selectedNav === "users" ? "users" : ""}...`}
        className="admin-search-input"
        value={searchTerms[searchKey]}
        onChange={(e) =>
          setSearchTerms((prev) => ({
            ...prev,
            [searchKey]: e.target.value,
          }))
        }
        disabled={selectedNav === "overview"}
      />
      {searchTerms[searchKey] && (
        <button
          className="admin-search-clear"
          onClick={() =>
            setSearchTerms((prev) => ({
              ...prev,
              [searchKey]: "",
            }))
          }
        >
          ×
        </button>
      )}
    </div>
  );

  const { filteredMountains, filteredUsers, filteredCandidates } = getFilteredData();

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
          <div
            className={`admin-nav-item ${selectedNav === "imports" ? "active" : ""}`}
            onClick={() => setSelectedNav("imports")}
          >
            <FiDownloadCloud className="admin-nav-icon" />
            <span>Imports</span>
          </div>
          {/* Remove Settings nav item */}
          <div
            className={`admin-nav-item ${selectedNav === "audit" ? "active" : ""}`}
            onClick={() => setSelectedNav("audit")}
          >
            <FiFileText className="admin-nav-icon" />
            <span>Audit Log</span>
          </div>
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
                      <th>Guide</th>
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
                              src={getMountainImageUrl(mountain.photo_url)}
                              alt={mountain.name}
                              className="mountain-small-image"
                              onError={(e) => {
                                e.target.src = FALLBACK_MOUNTAIN_IMAGE;
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
                          <td>
                            <strong>{mountain.guide_status === "guide_ready" ? "Verified" : "Preview"}</strong>
                            <small className="admin-table-secondary">{mountain.guide_quality_score || 0}/100</small>
                          </td>
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
                        <td colSpan="9" style={{ textAlign: "center" }}>
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
            {selectedNav === "imports" && (
              <div className="admin-imports">
                <section className="admin-locations-table">
                  <div className="admin-table-header">
                    <div>
                      <p className="admin-table-kicker">Editorial review queue</p>
                      <h2>Imported Destinations</h2>
                    </div>
                    <button
                      className="admin-add-location-btn"
                      type="button"
                      onClick={handleBulkPublish}
                      disabled={selectedCandidateIds.length === 0}
                    >
                      <FiCheck />
                      Publish selected ({selectedCandidateIds.length})
                    </button>
                  </div>

                  {showEditForm && selectedMountain && (
                    <EditLocationForm
                      mountainId={selectedMountain.id}
                      onClose={() => {
                        setShowEditForm(false);
                        setSelectedMountain(null);
                      }}
                      onLocationUpdated={loadImports}
                    />
                  )}

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Image</th>
                        <th>Destination</th>
                        <th>Facts</th>
                        <th>Attribution</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.length > 0 ? (
                        filteredCandidates.map((candidate) => (
                          <tr key={candidate.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedCandidateIds.includes(candidate.id)}
                                onChange={() => toggleCandidate(candidate.id)}
                                aria-label={`Select ${candidate.name}`}
                              />
                            </td>
                            <td>
                              <img
                                src={getMountainImageUrl(candidate.media_thumbnail_url || candidate.photo_url)}
                                alt={candidate.name}
                                className="mountain-small-image"
                                onError={(event) => {
                                  event.target.src = FALLBACK_MOUNTAIN_IMAGE;
                                  event.target.onerror = null;
                                }}
                              />
                            </td>
                            <td>
                              <strong>{candidate.name}</strong>
                              <small className="admin-table-secondary">{candidate.region || candidate.location}</small>
                            </td>
                            <td>
                              <span>{candidate.continent}</span>
                              <small className="admin-table-secondary">
                                {candidate.elevation_m ? `${Number(candidate.elevation_m).toLocaleString()} m` : "Elevation unavailable"}
                              </small>
                            </td>
                            <td>
                              <a href={candidate.source_url} target="_blank" rel="noreferrer" className="admin-source-link">
                                Wikidata <FiExternalLink />
                              </a>
                              <small className="admin-table-secondary">
                                {candidate.media_attribution || candidate.source_attribution}
                              </small>
                            </td>
                            <td>
                              <div className="admin-action-buttons">
                                <button className="admin-edit-btn" type="button" onClick={() => handleEdit(candidate)}>
                                  <FiEdit2 /> Edit
                                </button>
                                <button className="admin-publish-btn" type="button" onClick={() => handleCandidateStatus(candidate.id, "publish")}>
                                  <FiCheck /> Publish
                                </button>
                                <button className="admin-delete-btn" type="button" onClick={() => handleCandidateStatus(candidate.id, "reject")}>
                                  <FiX /> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center" }}>No draft destinations waiting for review.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </section>

                <section className="admin-locations-table">
                  <div className="admin-table-header">
                    <div>
                      <p className="admin-table-kicker">Provider activity</p>
                      <h2>Recent Ingestion Runs</h2>
                    </div>
                  </div>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Started</th>
                        <th>Mode</th>
                        <th>Status</th>
                        <th>Fetched</th>
                        <th>Staged</th>
                        <th>Updated</th>
                        <th>Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingestionRuns.length > 0 ? ingestionRuns.map((run) => (
                        <tr key={run.id}>
                          <td>{new Date(run.started_at).toLocaleString()}</td>
                          <td>{run.mode}</td>
                          <td>{run.status}</td>
                          <td>{run.fetched_count}</td>
                          <td>{run.staged_count}</td>
                          <td>{run.updated_count}</td>
                          <td>{run.error_count}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="7" style={{ textAlign: "center" }}>No ingestion runs recorded yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </section>
              </div>
            )}

            {/* Audit Log View */}
            {selectedNav === "audit" && (
              <div className="admin-audit-view">
                <div className="admin-table-header">
                  <div>
                    <p className="admin-table-kicker">Security & compliance</p>
                    <h2>Admin Audit Log</h2>
                  </div>
                </div>

                {loading ? (
                  <div className="admin-loading">Loading audit entries…</div>
                ) : error ? (
                  <div className="admin-error">{error}</div>
                ) : auditLog.length === 0 ? (
                  <div className="admin-empty">No audit entries yet.</div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>When</th>
                        <th>Actor</th>
                        <th>Action</th>
                        <th>Resource</th>
                        <th>IP Address</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.map((entry) => (
                        <tr key={entry.id}>
                          <td className="audit-time">
                            {new Date(entry.created_at).toLocaleString()}
                          </td>
                          <td className="audit-actor">{entry.actor_username}</td>
                          <td>
                            <span className="audit-action-badge">{entry.action}</span>
                          </td>
                          <td>
                            {entry.resource_type && (
                              <span className="audit-resource">
                                {entry.resource_type}
                                {entry.resource_id ? ` / ${entry.resource_id}` : ""}
                              </span>
                            )}
                          </td>
                          <td className="audit-ip">{entry.ip_address || "—"}</td>
                          <td className="audit-details">
                            {entry.details && Object.keys(entry.details).length > 0
                              ? JSON.stringify(entry.details)
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
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
