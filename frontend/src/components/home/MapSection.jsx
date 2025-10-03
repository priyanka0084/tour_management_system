import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon URLs to use CDN
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const centerCoords = [20.5937, 78.9629]; // India center

const MapSection = () => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(centerCoords);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map', {
        center: centerCoords,
        zoom: 5,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      markerRef.current = L.marker(centerCoords).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && selectedPosition) {
      mapRef.current.setView(selectedPosition, 10);
      if (markerRef.current) {
        markerRef.current.setLatLng(selectedPosition);
      }
    }
  }, [selectedPosition]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length > 2) {
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          e.target.value
        )}`
      )
        .then((res) => res.json())
        .then((data) => {
          setSearchResults(data);
        })
        .catch(() => setSearchResults([]));
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectPlace = (place) => {
    setSelectedPosition([parseFloat(place.lat), parseFloat(place.lon)]);
    setSearchTerm(place.display_name);
    setSearchResults([]);
  };

  return (
    <section
      className="map-section"
      style={{
        padding: '20px 10px',
        maxWidth: '800px',
        margin: '40px auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderRadius: '12px',
        backgroundColor: '#fff',
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          marginBottom: '20px',
          fontSize: '2rem',
          fontWeight: '700',
          color: '#222',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        Our Locations
      </h2>

      <div style={{ position: 'relative', marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Search tourist places worldwide"
          value={searchTerm}
          onChange={handleSearchChange}
          style={{
            boxSizing: 'border-box',
            border: '1px solid #ddd',
            width: '100%',
            height: '45px',
            padding: '0 15px',
            borderRadius: '8px',
            fontSize: '16px',
            outline: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            transition: 'border-color 0.3s ease',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#ff4081')}
          onBlur={(e) => (e.target.style.borderColor = '#ddd')}
        />
        {searchResults.length > 0 && (
          <ul
            style={{
              position: 'absolute',
              top: '50px',
              left: 0,
              right: 0,
              maxHeight: '220px',
              overflowY: 'auto',
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '0 0 8px 8px',
              zIndex: 1000,
              margin: 0,
              padding: 0,
              listStyle: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            {searchResults.map((place) => (
              <li
                key={place.place_id}
                onClick={() => handleSelectPlace(place)}
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  fontSize: '14px',
                  color: '#333',
                }}
                onMouseDown={(e) => e.preventDefault()} // prevent input blur
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#fce4ec')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                {place.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        id="map"
        style={{
          height: '400px',
          width: '100%',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      ></div>
    </section>
  );
};

export default MapSection;
