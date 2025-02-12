import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../server/utils/fetchWithAuth";
import { FiUpload } from "react-icons/fi";
import "./EditLocationForm.css";

const EditLocationForm = ({ mountainId, onClose, onLocationUpdated }) => {
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
  const [uploadMethod, setUploadMethod] = useState("url");

  useEffect(() => {
    const fetchMountainData = async () => {
      try {
        const response = await fetchWithAuth(
          `http://localhost:5000/admin/mountains/${mountainId}`
        );
        const data = await response.json();
        if (data.success) {
          setFormData(data.mountain);
          // Set preview URL based on photo_url type
          const photoUrl = data.mountain.photo_url;
          if (photoUrl.startsWith("http")) {
            setPreviewUrl(photoUrl);
          } else {
            // For local files, construct the full URL
            setPreviewUrl(
              `http://localhost:5000/src/assets/mountain_photos/${photoUrl}`
            );
          }
        }
      } catch (error) {
        setError(`Failed to fetch mountain data: ${error.message}`);
      }
    };

    fetchMountainData();
  }, [mountainId]);

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

        const uploadResponse = await fetchWithAuth(
          "http://localhost:5000/admin/upload-photo",
          {
            method: "POST",
            body: formDataWithFile,
          }
        );

        if (!uploadResponse.ok) throw new Error("Failed to upload image");

        const uploadData = await uploadResponse.json();
        if (!uploadData.success) throw new Error(uploadData.message);

        photoUrl = uploadData.filename;
      }

      const response = await fetchWithAuth(
        `http://localhost:5000/admin/mountains/${mountainId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, photo_url: photoUrl }),
        }
      );

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      onLocationUpdated();
      onClose();
    } catch (error) {
      setError(error.message || "Failed to update location");
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

  const ImagePreview = () => {
    const [imgError, setImgError] = useState(false);

    if (!previewUrl && !formData.photo_url) return null;

    return (
      <div className="image-preview-container">
        <img
          src={previewUrl}
          alt="Preview"
          className="image-preview"
          onError={(e) => {
            if (!imgError) {
              setImgError(true);
              e.target.src = "/src/assets/placeholder-mountain.jpg";
            }
          }}
        />
      </div>
    );
  };

  return (
    <div className="edit-location-modal">
      <div className="edit-location-content">
        <h2>Edit Location</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="edit-location-form">
          <div className="form-grid">
            <div className="form-left">
              <div className="form-group">
                <label>Mountain Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
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

                <ImagePreview />
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
            />
          </div>

          <div className="edit-actions">
            <button type="submit" className="update-btn" disabled={loading}>
              {loading ? "Updating..." : "Update Location"}
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

export default EditLocationForm;
