import React, { useEffect, useRef, useState } from "react";
import Navbar from "../components/common/Navbar";
import HeroSection from "../components/home/HeroSection";
import FeaturedDestinations from "../components/home/FeaturedDestinations";
import WhyChooseUs from "../components/home/WhyChooseUs";
import Testimonials from "../components/home/Testimonials";
import MapSection from "../components/home/MapSection";

import "../styles/home.css";

const HomePage = () => {
  const footerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Footer fade-in effect on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (footerRef.current) observer.observe(footerRef.current);
    return () => {
      if (footerRef.current) observer.unobserve(footerRef.current);
    };
  }, []);

  return (
    <div className="page-background">
      <Navbar />
      <HeroSection />

      {/* Popular Destinations */}
      <section id="destinations">
        <FeaturedDestinations />
      </section>


      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* Testimonials */}
      <Testimonials />

      



      {/* Map Section */}
      <MapSection />

      {/* Footer */} 
      <footer className={`footer ${isVisible ? "visible" : ""}`} ref={footerRef}>
        <div className="footer-container">
          <div className="footer-section about">
            <h3>About Us</h3>
            <p>
              ExploreEase helps you discover amazing destinations around the
              world.
            </p>
          </div>

          <div className="footer-section socials">
            <h3>Follow Us</h3>
            <div className="social-icons">
              <a href="#" className="social-btn facebook">F</a>
              <a href="#" className="social-btn instagram">I</a>
              <a href="#" className="social-btn twitter">T</a>
            </div>
          </div>
        </div>

        <p className="footer-bottom">© 2025 ExploreEase. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;