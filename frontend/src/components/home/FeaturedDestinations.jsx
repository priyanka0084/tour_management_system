import React from "react";


export default function Destinations() {
  const popular = [
    {
      name: "Paris",
      img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80&auto=format&fit=crop",
      desc: "City of lights and romance. Iconic art, cafes, and river walks."
    },
    {
      name: "Maldives",
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80&auto=format&fit=crop",
      desc: "Turquoise waters and white sands. A true tropical escape."
    },
    {
      name: "Switzerland",
      img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80&auto=format&fit=crop",
      desc: "Snowy Alps, calm lakes, and postcard-perfect villages."
    },
    {
      name: "Bali",
      img: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=1200&q=80&auto=format&fit=crop",
      desc: "Lush temples, beaches, and a relaxed island vibe."
    },


  ];


  const gallery = [
    //"https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&q=80&auto=format&fit=crop",
    //"https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80&auto=format&fit=crop",
  ];


  return (
    <>
      {/* Local, component-scoped CSS so you don’t need any external styles */}
      <style>{`
        :root {
          --card-w: 280px;
          --radius: 18px;
          --shadow: 0 14px 28px rgba(0,0,0,.12), 0 10px 10px rgba(0,0,0,.08);
          --shadow-lg: 0 28px 60px rgba(0,0,0,.22), 0 20px 20px rgba(0,0,0,.12);
          --accent: #ff5a5f;
        }
        .wrap {
          width: 100%;
        .section {
          text-align: center;
          margin-bottom: 48px;
        }
        .title {
          font: 700 32px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue", sans-serif;
          color: #222;
          display: inline-block;
          position: relative;
          margin: 0 0 28px;
        }
        .title::after {
          content: "";
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: -10px;
          width: 90px;
          height: 5px;
          border-radius: 999px;
          background: var(--accent);
        }


        /* Popular grid */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(var(--card-w), 1fr));
          gap: 26px;
          justify-items: center; /* center cards in each grid cell */
          align-items: start;
        }
        .card {
          width: var(--card-w);
          background: #fff;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          overflow: hidden;
          transform: translateZ(0);
          transition: transform .45s ease, box-shadow .45s ease;
          will-change: transform;
        }
        /* 3D-ish lift/tilt on hover */
        .card:hover {
          transform: perspective(900px) translateY(-8px) rotateX(2.2deg) rotateY(-2.2deg) scale(1.03);
          box-shadow: var(--shadow-lg);
        }
        .thumb {
          height: 150px;
          width: 100%;
          object-fit: cover;
          display: block;
        }
        .body {
          padding: 16px 16px 20px;
        }
        .name {
          margin: 8px 0 8px;
          font: 700 18px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue", sans-serif;
          color: #111;
        }
        .desc {
          margin: 0 auto;
          max-width: 90%;
          color: #5a5a5a;
          font: 500 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial, "Helvetica Neue", sans-serif;


          display: -webkit-box;
          -webkit-line-clamp: 2;   /* exactly two lines */
          -webkit-box-orient: vertical;
          overflow: hidden;
        }


        /* Travel Gallery */
        .galleryGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 22px;
          justify-items: center;
        }
        .gItem {
          width: 100%;
          max-width: 340px;
          aspect-ratio: 16 / 9;
          border-radius: var(--radius);
          overflow: hidden;
          position: relative;
          box-shadow: var(--shadow);
          transition: transform .35s ease, box-shadow .35s ease;
          background: #fff;
        }
        .gItem:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: var(--shadow-lg);
        }
        .gImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }


        /* Page background */
        .pageBg {
          background:
            radial-gradient(1200px 600px at 50% -50%, #eaf3ff 0%, transparent 60%),
            radial-gradient(900px 500px at 120% 10%, #fff0f0 0%, transparent 60%),
            #f7f7fb;
          min-height: 100vh;
        }
      `}</style>


      <div className="pageBg">
        <div className="wrap">
          {/* Popular Destinations */}
          <section className="section">
            <h2 className="title">Popular Destinations</h2>


            <div className="grid">
              {popular.map((d) => (
                <article className="card" key={d.name}>
                  <img className="thumb" src={d.img} alt={d.name} />
                  <div className="body">
                    <h3 className="name">{d.name}</h3>
                    <p className="desc">{d.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>


          {/* Travel Gallery (optional; matches your screenshot layout) */}
          <section className="section" style={{ marginTop: 56 }}>
            <h2 className="title">Travel Gallery</h2>
            <div className="galleryGrid">
              {gallery.map((src, i) => (
                <div className="gItem" key={i}>
                  <img className="gImg" src={src} alt={`Gallery ${i + 1}`} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}


