import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="logo">
          <Link to="/">JourneyHub</Link>
        </div>
        <ul className="nav-links">
          <li><Link to="/" className={location.pathname === "/" ? "active" : ""}>Home</Link></li>
          <li><Link to="/about" className={location.pathname === "/about" ? "active" : ""}>About</Link></li>
          <li><Link to="/destinations" className={location.pathname === "/destinations" ? "active" : ""}>Destinations</Link></li>
          <li><Link to="/booking" className={location.pathname === "/booking" ? "active" : ""}>Book Tour</Link></li>
          <li><a href="#reviews">Reviews</a></li>
          <li><a href="#contact">Contact</a></li>
          <li><Link to="/login" className={location.pathname === "/login" ? "active" : ""}>Login</Link></li>
          <li><Link to="/register" className={location.pathname === "/register" ? "active" : ""}>Register</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
