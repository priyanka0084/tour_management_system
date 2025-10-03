import React from "react";

const HeroSection = () => {
  const videoSource = "/videos/mixkit-beautiful-coast-with-motorboats-and-a-pier-seen-from-the-5363-hd-ready.mp4"; // Replace 'your-video-file.mp4' with your actual video filename in public/videos

  return (
    <section className="hero-section" style={{ position: "relative", height: "80vh", overflow: "hidden" }}>
      <video
        className="hero-video"
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
        src={videoSource}
        type="video/mp4"
      />
      <div
        className="hero-overlay"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "white",
          textAlign: "center",
          backgroundColor: "transparent",
          padding: "30px",
          borderRadius: "10px",
          margin: "auto",
          maxWidth: "90%",
        }}
      >
        <h1>Explore the World with JourneyHub</h1>
        <p>Your adventure starts here</p>
        <button className="btn" onClick={() => window.location.href = "/destinations"}>
          Explore
        </button>
      </div>
    </section>
  );
};

export default HeroSection;