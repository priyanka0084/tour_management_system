import React from "react";
import "../../styles/home.css";


const GallerySection = () => {
  const gallery = [
    "https://source.unsplash.com/400x300/?beach",
    "https://source.unsplash.com/400x300/?mountain",
    "https://source.unsplash.com/400x300/?city",
    "https://source.unsplash.com/400x300/?forest",
    "https://source.unsplash.com/400x300/?desert",
    "https://source.unsplash.com/400x300/?island",
  ];


  return (
    <div className="section-container">
      <h2 className="section-title">Travel Gallery</h2>
      <div className="grid-container">
        {gallery.map((img, i) => (
          <div className="card-3d" key={i}>
            <img src={img} alt="Gallery" />
          </div>
        ))}
      </div>
    </div>
  );
};


export default GallerySection;
