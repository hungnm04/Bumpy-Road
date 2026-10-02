import "./HeroStyles.css";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LuArrowRight, LuMap, LuMapPin, LuMountain } from "react-icons/lu";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

function Hero(props) {
  const imgRef = useRef(null);

  // Scroll parallax — hero image moves at 0.4× scroll speed (depth effect)
  useEffect(() => {
    if (props.cName !== "hero") return;
    const onScroll = () => {
      if (imgRef.current) {
        imgRef.current.style.transform = `scale(1.08) translateY(${window.scrollY * 0.35}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [props.cName]);

  const stats = props.stats || [
    { value: "42", label: "Featured climbs", icon: <LuMountain /> },
    { value: "6", label: "Continents", icon: <LuMapPin /> },
    { value: "24h", label: "Fresh stories", icon: <LuMap /> },
  ];

  return (
    <motion.div
      className={props.cName}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.img
        ref={imgRef}
        src={props.heroImg}
        alt="Mountain"
        className="hero-bg-image"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        style={{ willChange: "transform" }}
      />
      <div className="hero-text">
        {props.kicker && (
          <motion.p
            className="hero-kicker"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {props.kicker}
          </motion.p>
        )}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {props.title}
        </motion.h1>
        {props.text && (
          <motion.p
            className="hero-copy"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            {props.text}
          </motion.p>
        )}
        {props.btnText && props.url && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Link to={props.url} className={props.btnClass}>
              {props.btnText}
              <motion.span
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <LuArrowRight />
              </motion.span>
            </Link>
          </motion.div>
        )}
        {props.cName === "hero" && (
          <motion.div
            className="hero-stats"
            aria-label="Bumpy Road highlights"
            variants={stagger}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.65, staggerChildren: 0.1 }}
          >
            {stats.map((stat) => (
              <motion.div
                className="hero-stat"
                key={`${stat.value}-${stat.label}`}
                variants={fadeUp}
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.span
                  className="hero-stat-icon"
                  whileHover={{ rotate: 10 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {stat.icon || <LuMap />}
                </motion.span>
                <strong>{stat.value}</strong>
                <small>{stat.label}</small>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default Hero;
