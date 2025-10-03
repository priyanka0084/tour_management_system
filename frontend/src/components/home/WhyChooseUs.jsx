import React from "react";
import "../../styles/home.css";

const WhyChooseUs = () => {
  return (
    <section className="section why-choose-us">
      <h2 className="section-title">Why Choose Us</h2>
      <div className="card-container">
        <div className="info-card">
          <h3>🌍 Wide Range of Destinations</h3>
          <p>Explore unique places around the globe with handpicked experiences.</p>
        </div>
        <div className="info-card">
          <h3>💰 Best Price Guarantee</h3>
          <p>We offer affordable packages without compromising on quality.</p>
        </div>
        <div className="info-card">
          <h3>⭐ Trusted by Travelers</h3>
          <p>Thousands of happy travelers trust JourneyHub every year.</p>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
