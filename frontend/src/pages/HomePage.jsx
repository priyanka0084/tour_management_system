import React, { useEffect, useRef, useState } from "react";
import Navbar from "../components/common/Navbar";
import HeroSection from "../components/home/HeroSection";
import FeaturedDestinations from "../components/home/FeaturedDestinations";
import WhyChooseUs from "../components/home/WhyChooseUs";
import Testimonials from "../components/home/Testimonials";
import MapSection from "../components/home/MapSection";
import "../styles/home.css";
import RecommendationsPreview from '../components/home/RecommendationsPreview';
import '../styles/recommendationsPreview.css';
const HomePage = () => {
  const footerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // ✅ Footer fade-in effect
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

  // ✅ Google Translate Integration with fixed positioning
  useEffect(() => {
    if (!document.getElementById("google-translate-script")) {
      const addScript = document.createElement("script");
      addScript.id = "google-translate-script";
      addScript.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(addScript);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,ta,hi,te,ml,kn,ur,gu",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          "google_translate_element"
        );
      };
    }

    // ✅ Add custom styles for Google Translate
    const style = document.createElement("style");
    style.id = "google-translate-custom-styles";
    style.innerHTML = `
      /* Hide Google Translate banner */
      .goog-te-banner-frame.skiptranslate {
        display: none !important;
      }
      
      body {
        top: 0 !important;
      }

      /* Language selector fixed button */
      .language-selector-btn {
        position: fixed;
        top: 20px;
        right: 30px;
        z-index: 10000;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        transition: all 0.3s ease;
      }

      .language-selector-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      }

      /* Language dropdown menu */
      .language-dropdown {
        position: fixed;
        top: 90px;
        right: 30px;
        z-index: 9999;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        padding: 15px;
        min-width: 200px;
        display: none;
      }

      .language-dropdown.show {
        display: block;
        animation: slideDown 0.3s ease;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .language-dropdown h4 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 14px;
        font-weight: 600;
        text-align: center;
      }

      /* Style the Google Translate element inside dropdown */
      #google_translate_element {
        text-align: center;
      }

      .goog-te-combo {
        width: 100%;
        padding: 10px;
        border: 2px solid #667eea;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        outline: none;
        transition: all 0.3s;
        background: white;
      }

      .goog-te-combo:hover,
      .goog-te-combo:focus {
        border-color: #764ba2;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .goog-te-gadget {
        font-family: inherit !important;
      }

      .goog-te-gadget-simple {
        background: transparent !important;
        border: none !important;
      }

      /* Hide "Powered by" text */
      .goog-te-gadget-simple .goog-te-menu-value span:first-child {
        display: none;
      }

      .goog-logo-link {
        display: none !important;
      }

      .goog-te-gadget span {
        display: none !important;
      }
    `;
    
    if (!document.getElementById("google-translate-custom-styles")) {
      document.head.appendChild(style);
    }

    return () => {
      const existingStyle = document.getElementById("google-translate-custom-styles");
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLanguageMenu && 
          !event.target.closest('.language-selector-btn') && 
          !event.target.closest('.language-dropdown')) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageMenu]);

  return (
    <div className="page-background">
      <Navbar />

      {/* ✅ Floating Language Selector Button */}
      <button 
        className="language-selector-btn"
        onClick={() => setShowLanguageMenu(!showLanguageMenu)}
        title="Change Language"
      >
        🌐
      </button>

      {/* ✅ Language Dropdown Menu */}
      <div className={`language-dropdown ${showLanguageMenu ? 'show' : ''}`}>
        <h4>Select Language</h4>
        <div id="google_translate_element"></div>
      </div>

      <HeroSection />

      {/* Popular Destinations */}
      <section id="destinations">
        <FeaturedDestinations />
      </section>
      <RecommendationsPreview />
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
              ExploreEase helps you discover amazing destinations around the world.
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
