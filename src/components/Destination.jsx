import Mountain1 from "../assets/4.jpg";
import Mountain2 from "../assets/9.jpg";
import Mountain3 from "../assets/10.jpg";
import Mountain4 from "../assets/8.jpg";
import DestinationData from "./DestinationData";
import "./DestinationStyles.css";

const Destination = () => {
  return (
    <div className="destination">
      <h1 className="destination-title">Discover Popular Destinations</h1>
      <p className="destination-quote">
        "Mountains are the cathedrals where I practice my religion." - Anatoli Boukreev
      </p>

      <DestinationData
        className="destination-block reverse"
        heading="Adventure Awaits"
        text="Venture into the wild, where the allure of towering peaks invites thrill-seekers and nature lovers alike. Whether you're ascending craggy cliffs or hiking serene paths, the mountains promise untamed beauty and a sense of freedom that can't be found elsewhere."
        img1={Mountain1}
        img2={Mountain2}
      />

      <DestinationData
        className="destination-block"
        heading="Serenity and Solitude"
        text="Step away from the clamor of daily life and into the peace that only mountains can offer. Surrounded by towering trees and the gentle hum of nature, you'll find solace in the stillness of these high-altitude retreats, a place to reflect and reconnect."
        img1={Mountain3}
        img2={Mountain4}
      />
    </div>
  );
};

export default Destination;
