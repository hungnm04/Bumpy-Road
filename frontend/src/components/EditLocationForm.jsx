import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../api/fetchWithAuth";
import { FALLBACK_MOUNTAIN_IMAGE, getMountainImageUrl } from "../api/assetUrls";
import { FiUpload } from "react-icons/fi";
import "./EditLocationForm.css";

const EditLocationForm = ({ mountainId, onClose, onLocationUpdated }) => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    continent: "",
    photo_url: "",
    region: "",
    country_code: "",
    elevation_m: "",
    latitude: "",
    longitude: "",
    destination_type: "mountain_town",
    editorial_tags: [],
    traveler_fit: [],
    avoid_if: [],
    best_seasons: [],
    stay_style: "",
    transport_notes: "",
    planning_notes: "",
    photo_verified: false,
    guide_status: "preview",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadMethod, setUploadMethod] = useState("url");

  useEffect(() => {
    const fetchMountainData = async () => {
      try {
        const response = await fetchWithAuth(`/admin/mountains/${mountainId}`);
        const data = await response.json();
        if (data.success) {
          setFormData(data.mountain);
          const photoUrl = data.mountain.photo_url;
          setPreviewUrl(getMountainImageUrl(photoUrl));
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

        const uploadResponse = await fetchWithAuth("/admin/upload-photo", {
          method: "POST",
          body: formDataWithFile,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload image");

        const uploadData = await uploadResponse.json();
        if (!uploadData.success) throw new Error(uploadData.message);

        photoUrl = uploadData.url;
      }

      const response = await fetchWithAuth(`/admin/mountains/${mountainId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, photo_url: photoUrl }),
      });

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
    const { checked, name, type, value } = e.target;
    const listFields = new Set(["editorial_tags", "traveler_fit", "avoid_if", "best_seasons"]);
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox"
        ? checked
        : listFields.has(name)
        ? value.split(",").map((tag) => tag.trim()).filter(Boolean)
        : value,
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
              e.target.src = FALLBACK_MOUNTAIN_IMAGE;
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

              <div className="form-group">
                <label>Region:</label>
                <input
                  type="text"
                  name="region"
                  value={formData.region || ""}
                  onChange={handleChange}
                  placeholder="e.g., Valais"
                />
              </div>

              <div className="form-group">
                <label>Country Code:</label>
                <input
                  type="text"
                  name="country_code"
                  value={formData.country_code || ""}
                  onChange={handleChange}
                  maxLength="2"
                  placeholder="e.g., CH"
                />
              </div>

              <div className="form-group">
                <label>Elevation:</label>
                <input
                  type="number"
                  name="elevation_m"
                  value={formData.elevation_m || ""}
                  onChange={handleChange}
                  min="0"
                  placeholder="Meters"
                />
              </div>

              <div className="form-group">
                <label>Latitude:</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Longitude:</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Destination Type:</label>
                <select
                  name="destination_type"
                  value={formData.destination_type || "mountain_town"}
                  onChange={handleChange}
                >
                  <option value="mountain_town">Mountain town</option>
                  <option value="mountain_resort">Mountain resort</option>
                  <option value="ski_area">Ski area</option>
                  <option value="mountain_pass">Mountain pass</option>
                  <option value="mountain_hut">Mountain hut</option>
                  <option value="trail_hub">Trail hub</option>
                  <option value="national_park">National park</option>
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

          <div className="form-group full-width">
            <label>Editorial Tags:</label>
            <input
              name="editorial_tags"
              value={(formData.editorial_tags || []).join(", ")}
              onChange={handleChange}
              placeholder="family-friendly, rail-access, glacier"
            />
          </div>

          <div className="form-group full-width">
            <label>Works Well For:</label>
            <input
              name="traveler_fit"
              value={(formData.traveler_fit || []).join(", ")}
              onChange={handleChange}
              placeholder="first-time visitors, scenic-road travelers"
            />
          </div>

          <div className="form-group full-width">
            <label>Think Twice If:</label>
            <input
              name="avoid_if"
              value={(formData.avoid_if || []).join(", ")}
              onChange={handleChange}
              placeholder="drivers skipping road checks, fixed itinerary groups"
            />
          </div>

          <div className="form-group full-width">
            <label>Season Signals:</label>
            <input
              name="best_seasons"
              value={(formData.best_seasons || []).join(", ")}
              onChange={handleChange}
              placeholder="summer, early autumn"
            />
          </div>

          <div className="form-group full-width">
            <label>Stay Style:</label>
            <textarea name="stay_style" value={formData.stay_style || ""} onChange={handleChange} rows="2" />
          </div>

          <div className="form-group full-width">
            <label>Transport Notes:</label>
            <textarea name="transport_notes" value={formData.transport_notes || ""} onChange={handleChange} rows="2" />
          </div>

          <div className="form-group full-width">
            <label>Planning Notes:</label>
            <textarea name="planning_notes" value={formData.planning_notes || ""} onChange={handleChange} rows="2" />
          </div>

          <div className="form-grid">
            <label className="form-group">
              <span>Guide Status:</span>
              <select name="guide_status" value={formData.guide_status || "preview"} onChange={handleChange}>
                <option value="preview">Catalog preview</option>
                <option value="guide_ready">Verified guide</option>
              </select>
            </label>
            <label className="form-group">
              <span>Verified Destination Photo:</span>
              <input type="checkbox" name="photo_verified" checked={Boolean(formData.photo_verified)} onChange={handleChange} />
            </label>
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
