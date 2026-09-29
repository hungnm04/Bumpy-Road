import { motion } from "framer-motion";
import "./TripStyles.css";
import TripData from "./TripData";
import Trip1 from "../assets/5.jpg";
import Trip2 from "../assets/8.jpg";
import Trip3 from "../assets/12.jpg";

const trips = [
  {
    image: Trip2,
    label: "Volcanic ridge",
    heading: "Indonesia sunrise traverse",
    text: "A warm-start route with steep ash paths, early alarms, and cloud cover that breaks just in time.",
  },
  {
    image: Trip1,
    label: "High valley",
    heading: "Alpine lake approach",
    text: "Quiet water, sharp peaks, and the kind of trail that rewards slower planning.",
  },
  {
    image: Trip3,
    label: "Summit city",
    heading: "Urban-to-mountain escape",
    text: "For travelers stitching culture, food, and one serious climb into the same itinerary.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  hover: { y: -12, transition: { duration: 0.3 } },
};

function Trip() {
  return (
    <div className="trip">
      <motion.div
        className="trip-header"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <p className="eyebrow">Field notes</p>
        <h1>Recent stories from the road.</h1>
        <p>
          Every destination becomes easier to judge when someone has already written
          down the weather, the weird turns, and the view at the end.
        </p>
      </motion.div>
      <motion.div
        className="tripcard"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {trips.map((trip, index) => (
          <motion.div
            key={index}
            className="tripcard-item"
            variants={cardVariants}
            whileHover="hover"
          >
            <TripData {...trip} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default Trip;
