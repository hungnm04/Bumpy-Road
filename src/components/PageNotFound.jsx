import React from "react";
import { Link } from "react-router-dom";
import "./PageNotFoundStyles.css";

const PageNotFound = () => {
  return (
    <div className="container">
      <h1 className="heading">Oops!</h1>
      <h2 className="subheading">404 - PAGE NOT FOUND</h2>
      <p className="paragraph">
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <Link to="/" className="button">
        GO TO HOMEPAGE
      </Link>
    </div>
  );
};

export default PageNotFound;
