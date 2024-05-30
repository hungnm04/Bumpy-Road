import Mountain1 from "../assets/4.jpg";
import Mountain2 from "../assets/9.jpg";
import Mountain3 from "../assets/10.jpg";
import Mountain4 from "../assets/8.jpg";
import DestinationData from "./DestinationData";
import "./DestinationStyles.css";

const Destination = () => {
  return (
    <div className="destination">
      <h1>Popular Destinations</h1>
      <p>
        "Mountains are the cathedrals where I practice my religion." - Anatoli
        Boukreev
      </p>
      <DestinationData
        className="first-des-reverse"
        heading="Adventure Awaits"
        text="Embark on a journey to the heart of adventure in mountainous landscapes. Whether you're scaling sheer rock faces, trekking through dense forests, or skiing down powdery slopes, there's no shortage of excitement to be found among the peaks. Traverse winding trails that lead to hidden waterfalls, breathe in the crisp mountain air, and lose yourself in the awe-inspiring vistas that stretch as far as the eye can see."
        img1={Mountain1}
        img2={Mountain2}
      />

      <DestinationData
        className="first-des"
        heading="Serenity and Solitude"
        text=" Amidst the hustle and bustle of modern life, mountain retreats offer a sanctuary of serenity and solitude. Retreat to cozy mountain lodges nestled among pine forests, where the only sounds you'll hear are the rustling of leaves and the gentle melody of mountain streams. Disconnect from the chaos of the world below and reconnect with yourself in the tranquility of nature's embrace."
        img1={Mountain3}
        img2={Mountain4}
      />
    </div>
  );
};

export default Destination;
