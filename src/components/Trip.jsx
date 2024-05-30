import "./TripStyles.css";
import TripData from "./TripData";
import Trip1 from "../assets/5.jpg";
import Trip2 from "../assets/8.jpg";
import Trip3 from "../assets/12.jpg";

function Trip() {
  return (
    <div className="trip">
      <h1>Recent Trips</h1>
      <p>Discover more on google maps</p>
      <div className="tripcard">
        <TripData
          image={Trip2}
          heading="Trip to Indonesia"
        />

        <TripData image={Trip1} heading="Trip to Venice"  />
        <TripData image={Trip3} heading="Trip to Paris"  />
      </div>
    </div>
  );
}

export default Trip;
