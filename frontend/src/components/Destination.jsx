import { motion } from "framer-motion";
import Mountain1 from "../assets/4.jpg";
import Mountain2 from "../assets/9.jpg";
import Mountain3 from "../assets/10.jpg";
import Mountain4 from "../assets/8.jpg";
import DestinationData from "./DestinationData";
import "./DestinationStyles.css";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: "easeOut" } },
};

const Destination = () => {
  return (
    <div className="destination">
      <motion.div
        className="destination-header"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.p className="eyebrow" variants={itemVariants}>
          Plan with terrain in mind
        </motion.p>
        <motion.h1 className="destination-title" variants={itemVariants}>
          Choose the climb by mood, season, and story.
        </motion.h1>
        <motion.p className="destination-quote" variants={itemVariants}>
          Bumpy Road turns mountain browsing into a practical field guide: where to go,
          what it feels like, and what other travelers learned there.
        </motion.p>
      </motion.div>

      <motion.div
        className="destination-block reverse"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        <motion.div className="des-text" variants={itemVariants}>
          <p className="destination-eyebrow">For momentum</p>
          <h2>Find a route that matches your appetite.</h2>
          <p>
            Start with the mountain, then narrow your decision through location search,
            photos, reviews, and destination context. The interface should feel quick
            enough for a spontaneous weekend and structured enough for a serious
            expedition plan.
          </p>
        </motion.div>
        <motion.div className="image" variants={imageVariants}>
          <img src={Mountain1} alt="Mountain landscape" />
          <img src={Mountain2} alt="Mountain trail" />
        </motion.div>
      </motion.div>

      <motion.div
        className="destination-block"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
      >
        <motion.div className="des-text" variants={itemVariants}>
          <p className="destination-eyebrow">For clarity</p>
          <h2>Read the landscape before you commit.</h2>
          <p>
            Destination profiles, community reviews, and trip journals give each place a
            human signal. Instead of a generic travel catalog, Bumpy Road becomes a
            record of routes, seasons, mistakes, and memorable arrivals.
          </p>
        </motion.div>
        <motion.div className="image" variants={imageVariants}>
          <img src={Mountain3} alt="Mountain vista" />
          <img src={Mountain4} alt="Alpine scenery" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Destination;
