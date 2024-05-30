import React from "react";
import { Link } from "react-router-dom";
import './AdminDashboard.css';

const AdminDashboard = () => {
  const handleLogout = () => {
    localStorage.removeItem("token");
  };

  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Guest" },
    { id: 3, name: "Mike Johnson", email: "mike@example.com", role: "Guest" },
  ];

  return (
    <div className="dashboard-container">
      <h2>Welcome to the Admin Dashboard!</h2>
      <Link to="/" onClick={handleLogout} className="logout-button">
        Logout
      </Link>
      <table className="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <button className="edit-button">Edit</button>
                <button className="delete-button">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
