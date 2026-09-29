import React from "react";
import { Link } from "react-router-dom";
import "./PageNotFoundStyles.css";

const PageNotFound = () => {
  return (
    <div className="not-found-page">
      <h1 className="not-found-heading">Wrong turn.</h1>
      <h2 className="not-found-subheading">404 - Route not found</h2>
      <p className="not-found-copy">
        The trail marker you followed does not point to an active Bumpy Road page.
      </p>
      <Link to="/" className="not-found-button">
        Return home
      </Link>
    </div>
  );
};

export default PageNotFound;
