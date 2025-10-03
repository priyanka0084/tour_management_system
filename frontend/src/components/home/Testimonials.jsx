import React from "react";
import "../../styles/home.css";

const testimonialsData = [
  { id: 1, text: "ExploreEase made my honeymoon unforgettable in Maldives!", author: "Priya Sharma" },
  { id: 2, text: "Best travel experience ever, from booking to return!", author: "John Mathews" },
  { id: 3, text: "Affordable and reliable. Highly recommended!", author: "Aisha Khan" },
  { id: 4, text: "Excellent customer service and amazing destinations.", author: "Michael Lee" },
  { id: 5, text: "A seamless and enjoyable travel booking experience.", author: "Sara Wilson" },
  { id: 6, text: "Highly professional and trustworthy travel agency.", author: "David Kim" },
  { id: 7, text: "Great value for money and unforgettable memories.", author: "Emily Davis" },
];

const Testimonials = () => {
  return (
    <section className="section testimonials">
      <h2 className="section-title">What Our Travelers Say</h2>
      <div className="carousel-container">
        <div className="carousel-track">
          {testimonialsData.map(({ id, text, author }) => (
            <div key={id} className="testimonial-card">
              <p>"{text}"</p>
              <h4>- {author}</h4>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;