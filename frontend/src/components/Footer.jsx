import { motion } from "framer-motion";
import "./FooterStyles.css";
import { FaBehance, FaFacebookF, FaInstagram, FaXTwitter } from "react-icons/fa6";
import { LuArrowUpRight, LuMountain } from "react-icons/lu";

const socialLinks = [
  { icon: FaFacebookF, label: "Facebook", href: "/" },
  { icon: FaInstagram, label: "Instagram", href: "/" },
  { icon: FaBehance, label: "Behance", href: "/" },
  { icon: FaXTwitter, label: "X", href: "/" },
];

const exploreLinks = [
  { label: "Places", href: "/places" },
  { label: "Stories", href: "/blog" },
  { label: "About", href: "/about" },
];

const prepareLinks = [
  { label: "Contact", href: "/faq" },
  { label: "Mountain search", href: "/places" },
  { label: "Write a note", href: "/blog/create" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Footer = () => {
  return (
    <motion.footer
      className="footer"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="top">
        <motion.div
          className="brand"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.span className="footer-mark" variants={itemVariants}>
            <LuMountain />
          </motion.span>
          <motion.div variants={itemVariants}>
            <h1>Bumpy Road</h1>
            <p>Choose the route. Respect the mountain.</p>
          </motion.div>
        </motion.div>
        <motion.div
          className="social-icons"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {socialLinks.map(({ icon: Icon, label, href }) => (
            <motion.a
              key={label}
              href={href}
              aria-label={label}
              whileHover={{ y: -4, scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Icon />
            </motion.a>
          ))}
        </motion.div>
      </div>
      <motion.div
        className="bottom"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div className="footer-section" variants={itemVariants}>
          <h4>Explore</h4>
          {exploreLinks.map(({ label, href }) => (
            <motion.a
              key={label}
              href={href}
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {label} <LuArrowUpRight />
            </motion.a>
          ))}
        </motion.div>
        <motion.div className="footer-section" variants={itemVariants}>
          <h4>Prepare</h4>
          {prepareLinks.map(({ label, href }) => (
            <motion.a
              key={label}
              href={href}
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {label} <LuArrowUpRight />
            </motion.a>
          ))}
        </motion.div>
        <motion.div className="footer-section" variants={itemVariants}>
          <h4>Promise</h4>
          <p>Better travel decisions through real photos, real notes, and calmer planning.</p>
        </motion.div>
      </motion.div>
    </motion.footer>
  );
};

export default Footer;
