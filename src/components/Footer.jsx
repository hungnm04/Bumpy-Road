import "./FooterStyles.css";

const Footer = () => {
  return (
    <div className="footer">
      <div className="top">
        <div className="brand">
          <h1>Bumpy Road</h1>
          <p>Your Choice, Our Mission</p>
        </div>
        <div className="social-icons">
          <a href="/">
            <i className="fa-brands fa-facebook-square"></i>
          </a>
          <a href="/">
            <i className="fa-brands fa-instagram-square"></i>
          </a>
          <a href="/">
            <i className="fa-brands fa-behance-square"></i>
          </a>
          <a href="/">
            <i className="fa-brands fa-twitter-square"></i>
          </a>
        </div>
      </div>
      <div className="bottom">
        <div className="footer-section">
          <h4>Company</h4>
          <a href="/">About Us</a>
          <a href="/">Careers</a>
          <a href="/">Blog</a>
        </div>
        <div className="footer-section">
          <h4>Resources</h4>
          <a href="/">Support</a>
          <a href="/">Troubleshooting</a>
          <a href="/">Contact Us</a>
        </div>
        <div className="footer-section">
          <h4>Legal</h4>
          <a href="/">Terms of Service</a>
          <a href="/">Privacy Policy</a>
          <a href="/">License</a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
