import React, { useState } from "react";
import { FiUpload } from "react-icons/fi";
import { fetchWithAuth } from "../../server/utils/fetchWithAuth";
import "./AddLocationForm.css";

const AddLocationForm = ({ onClose, onLocationAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    continent: "",
    photo_url: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadMethod, setUploadMethod] = useState("url"); // 'url' or 'file'

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let photoUrl = formData.photo_url;

      if (uploadMethod === "file" && selectedFile) {
        const formDataWithFile = new FormData();
        formDataWithFile.append("photo", selectedFile);

        const uploadResponse = await fetch("http://localhost:5000/admin/upload-photo", {
          method: "POST",
          credentials: "include",
          body: formDataWithFile,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await uploadResponse.json();
        if (!data.success) {
          throw new Error(data.message);
        }

        // Use the full path for the uploaded file
        photoUrl = `/src/assets/mountain_photos/${data.filename}`;
      }

      const response = await fetchWithAuth("http://localhost:5000/admin/mountains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          photo_url: photoUrl,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to add location");
      }

      onLocationAdded();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Failed to add location");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="add-location-modal">
      <div className="add-location-content">
        <h2>Add New Location</h2>
        <p className="form-subtitle">Share an amazing mountain destination</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="add-location-form">
          <div className="form-grid">
            <div className="form-left">
              <div className="form-group">
                <label>Mountain Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Mount Everest"
                  required
                />
              </div>

              <div className="form-group">
                <label>Location:</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Nepal/China"
                  required
                />
              </div>

              <div className="form-group">
                <label>Continent:</label>
                <select
                  name="continent"
                  value={formData.continent}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Continent</option>
                  <option value="Asia">Asia</option>
                  <option value="Europe">Europe</option>
                  <option value="North America">North America</option>
                  <option value="South America">South America</option>
                  <option value="Africa">Africa</option>
                  <option value="Australia">Australia</option>
                  <option value="Antarctica">Antarctica</option>
                </select>
              </div>
            </div>

            <div className="form-right">
              <div className="form-group photo-upload-section">
                <label>Mountain Photo:</label>
                <div className="upload-method-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${uploadMethod === "url" ? "active" : ""}`}
                    onClick={() => setUploadMethod("url")}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${uploadMethod === "file" ? "active" : ""}`}
                    onClick={() => setUploadMethod("file")}
                  >
                    Upload File
                  </button>
                </div>

                {uploadMethod === "url" ? (
                  <input
                    type="text"
                    name="photo_url"
                    value={formData.photo_url}
                    onChange={handleChange}
                    placeholder="Enter image URL"
                    className="url-input"
                  />
                ) : (
                  <div className="file-upload-container">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      id="photo-upload"
                      className="file-input"
                    />
                    <label htmlFor="photo-upload" className="file-upload-label">
                      <FiUpload />
                      <span>Choose a file</span>
                    </label>
                  </div>
                )}

                <div className="image-preview-container">
                  {(previewUrl || formData.photo_url) && (
                    <img
                      src={previewUrl || formData.photo_url}
                      alt="Preview"
                      className="image-preview"
                      onError={(e) => {
                        e.target.src = "/src/assets/placeholder-mountain.jpg";
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="form-group full-width">
            <label>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Describe the mountain, its features, and why it's special..."
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Adding..." : "Add Mountain"}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLocationForm;
