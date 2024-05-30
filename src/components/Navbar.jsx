import React, { Component } from "react";
import "./NavbarStyles.css";
import { MenuItems } from "./MenuItems";
import ProfileDropdown from "./ProfileDropdown"; 


class Navbar extends Component {
  state = { 
    clicked: false,
    isAuthenticated: false 
  };

  componentDidMount() {
    const token = localStorage.getItem("token");
    const currentPath = window.location.pathname;
  
    if (token && currentPath === "/authenticated-home") {
      this.setState({ isAuthenticated: true });
    }
  }
  

  handleClick = () => {
    window.location.href = "/login";
  };

  handleClickHome =() => {
    window.location.href = "/";
  }
  

  render() {
    const { isAuthenticated } = this.state;
    return (
      <nav className="NavbarItems">
        <h1 onClick={() => this.handleClickHome()} style={{ cursor: "pointer" }}>
          Bumpy Road
        </h1>
        <div
          className="menu-icons"
          onClick={() => this.setState({ clicked: !this.state.clicked })}
        >
          <i
            className={this.state.clicked ? "fas fa-times" : "fas fa-bars"}
          ></i>
        </div>
        <ul className={this.state.clicked ? "nav-menu active" : "nav-menu"}>
          {MenuItems.map((item, index) => (
            <li key={index}>
              <a className={item.cName} href={item.url}>
                {item.title}
              </a>
            </li>
          ))}
        </ul>
        {isAuthenticated ? (
          <ProfileDropdown /> 
        ) : (
          <button className="auth-button" onClick={this.handleClick}>
            Login 
          </button>
        )}
      </nav>
    );
  }
}

export default Navbar;
