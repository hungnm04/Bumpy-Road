import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./MountainDetailsStyles.css";

function MountainDetails() {
  const { id } = useParams();
  const [mountain, setMountain] = useState(null); 

  useEffect(() => {
    fetch(`http://localhost:5000/places/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => setMountain(data)) 
      .catch((error) => console.error("Error fetching mountain data:", error));
  }, [id]);

  if (!mountain) {
    return <div>Loading...</div>;
  }

  const imageUrl = `/src/assets/mountain_photos/${mountain.photo_url}`;
    console.log("Image URL: ", imageUrl);


  return (
    <div className="mountain-details-page">
      <div className="mountain-image">
        <img src={imageUrl} alt={mountain.name} />
      </div>
      <div className="mountain-details">
        <h1 className="mountain-name">{mountain.name}</h1>
        <p><strong>Location:</strong> {mountain.location}, {mountain.continent}</p>
        <p><strong>Description:</strong> {mountain.description}</p>
        {/* Add more details as needed */}
      </div>
    </div>
  );
}

export default MountainDetails;
