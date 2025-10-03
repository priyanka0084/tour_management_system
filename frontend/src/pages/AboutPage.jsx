import React, { useEffect, useState, useMemo } from 'react';

const primaryColor = '#ff6b6b';

const HoverCard = ({ style, children }) => {
  const [isHover, setIsHover] = useState(false);
  return (
    <div
      style={{
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        transform: isHover ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: isHover ? '0 10px 28px rgba(0,0,0,0.10)' : '0 6px 16px rgba(0,0,0,0.06)',
        borderColor: isHover ? '#f3d1d1' : '#f0f0f0',
        ...style,
      }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      {children}
    </div>
  );
};

const AboutPage = () => {
  const [team, setTeam] = useState([
    { id: 1, name: 'Ava Patel', role: 'CEO & Co‑Founder', bio: 'Travel enthusiast leading strategy and partnerships.' },
    { id: 2, name: 'Liam Chen', role: 'CTO & Co‑Founder', bio: 'Engineer focused on scalable, reliable travel tech.' },
    { id: 3, name: 'Sofia Martinez', role: 'Head of Operations', bio: 'Ensures seamless traveler experiences worldwide.' },
    { id: 4, name: 'Noah Williams', role: 'Customer Success Lead', bio: 'Championing traveler happiness 24/7.' },
  ]);

  const [achievements, setAchievements] = useState([
    { id: 1, title: '10,000+ travelers served' },
    { id: 2, title: 'Best Travel Startup 2024' },
    { id: 3, title: 'Partnered with 200+ local guides' },
    { id: 4, title: '4.9/5 average customer rating' },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamRes, achRes] = await Promise.all([
          fetch('/api/about/team'),
          fetch('/api/about/achievements'),
        ]);
        if (teamRes.ok) {
          const t = await teamRes.json();
          if (Array.isArray(t) && t.length) setTeam(t);
        }
        if (achRes.ok) {
          const a = await achRes.json();
          if (Array.isArray(a) && a.length) setAchievements(a);
        }
      } catch {
        // fallback to defaults silently
      }
    };
    fetchData();
  }, []);

  const pageStyle = useMemo(() => ({
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#ffffff',
    color: '#222222',
    minHeight: '100vh',
    padding: '32px 20px',
    boxSizing: 'border-box',
  }), []);

  const containerStyle = {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  };

  const headerWrapStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #ececec',
    borderRadius: 16,
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  };

  const heroStyle = {
    padding: 24,
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  };

  const heroLeftStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minWidth: 260,
    flex: 1,
  };

  const brandChipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 700,
    color: primaryColor,
    backgroundColor: '#fff6f6',
    border: `1px solid ${primaryColor}`,
    padding: '6px 10px',
    borderRadius: 999,
    width: 'fit-content',
    letterSpacing: 0.3,
  };

  const titleStyle = {
    margin: 0,
    fontSize: 36,
    color: '#111111',
    lineHeight: 1.2,
  };

  const subtitleStyle = {
    margin: 0,
    color: '#444',
    lineHeight: 1.6,
  };

  const heroAsideStyle = {
    minWidth: 260,
    flex: '0 0 320px',
    padding: 16,
    borderLeft: '1px solid #f3f3f3',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  };

  const statStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    borderRadius: 12,
    padding: 14,
    textAlign: 'center',
  };

  const statNumStyle = {
    fontSize: 20,
    fontWeight: 800,
    color: primaryColor,
    margin: 0,
  };

  const statLabelStyle = {
    fontSize: 12,
    margin: '6px 0 0 0',
    color: '#666',
  };

  const sectionCardStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #ececec',
    borderRadius: 14,
    boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
    padding: 24,
  };

  const sectionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  };

  const sectionBadgeStyle = {
    width: 10,
    height: 10,
    backgroundColor: primaryColor,
    borderRadius: 999,
  };

  const sectionTitleStyle = {
    fontSize: 22,
    margin: 0,
    color: '#111111',
  };

  const paragraphStyle = {
    margin: 0,
    lineHeight: 1.65,
    color: '#333',
  };

  const cardsRowStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
    marginTop: 14,
  };

  const cardBase = {
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    borderRadius: 12,
    padding: 16,
  };

  const miniCardTitleStyle = {
    margin: '0 0 8px 0',
    fontSize: 18,
    color: primaryColor,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
    marginTop: 10,
  };

  const teamCardStyle = {
    ...cardBase,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const avatarStyle = {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#ffeaea',
    color: primaryColor,
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
  };

  const buttonRowStyle = {
    marginTop: 16,
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  };
const aboutBannerWrapStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
};

const aboutBannerTextStyle = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 44,
  fontWeight: 900,
  lineHeight: 1.1,
  margin: 0,
  backgroundImage: 'linear-gradient(90deg, #ff6b6b, #ff8a6b)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: '0 2px 0 rgba(255,107,107,0.15)',
  letterSpacing: 0.5,
};

const aboutAccentStyle = {
  width: 110,
  height: 8,
  backgroundColor: '#ff6b6b',
  borderRadius: 12,
};
  const primaryButtonStyle = {
    backgroundColor: primaryColor,
    color: '#ffffff',
    border: 'none',
    padding: '12px 18px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
    letterSpacing: 0.3,
    transition: 'transform 160ms ease, box-shadow 160ms ease',
  };

  const icon = {
    mission: '🎯',
    vision: '🌍',
    curated: '🧭',
    pricing: '💳',
    support: '🕑',
    trophy: '🏆',
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerWrapStyle}>
          <div style={heroStyle}>
            <div style={aboutBannerWrapStyle}>
  <h1 style={aboutBannerTextStyle}>About Us</h1>
  <div style={aboutAccentStyle} />
</div>
            <div style={heroLeftStyle}>
              <span style={brandChipStyle}>
                ✈️ ExplorEase
              </span>
              <h1 style={titleStyle}>Travel, made simple and unforgettable.</h1>
              <p style={subtitleStyle}>
                We craft curated journeys with transparent pricing and real human support—anytime, anywhere.
              </p>
            </div>
            <aside style={heroAsideStyle} aria-label="Key highlights">
              <div style={statStyle}>
                <p style={statNumStyle}>10k+</p>
                <p style={statLabelStyle}>Travelers served</p>
              </div>
              <div style={statStyle}>
                <p style={statNumStyle}>200+</p>
                <p style={statLabelStyle}>Local partners</p>
              </div>
              <div style={statStyle}>
                <p style={statNumStyle}>4.9/5</p>
                <p style={statLabelStyle}>Average rating</p>
              </div>
              <div style={statStyle}>
                <p style={statNumStyle}>24/7</p>
                <p style={statLabelStyle}>Live support</p>
              </div>
            </aside>
          </div>
        </div>

        {/* Company Story, Mission & Vision */}
        <section style={sectionCardStyle} aria-labelledby="story-heading">
          <div style={sectionHeaderStyle}>
            <div style={sectionBadgeStyle} />
            <h2 id="story-heading" style={sectionTitleStyle}>Company Story, Mission & Vision</h2>
          </div>
          <p style={paragraphStyle}>
            ExplorEase was founded to make travel planning simple, transparent, and unforgettable.
            We connect travelers with curated experiences and trusted local experts worldwide.
          </p>
          <div style={cardsRowStyle}>
            <HoverCard style={{ ...cardBase }}>
              <h3 style={miniCardTitleStyle}>{icon.mission} Our Mission</h3>
              <p style={paragraphStyle}>
                Empower every traveler with seamless planning, transparent pricing, and memorable experiences.
              </p>
            </HoverCard>
            <HoverCard style={{ ...cardBase }}>
              <h3 style={miniCardTitleStyle}>{icon.vision} Our Vision</h3>
              <p style={paragraphStyle}>
                Be the world’s most trusted platform for curated, responsible, and joyful travel.
              </p>
            </HoverCard>
          </div>
        </section>

        {/* Why Choose ExplorEase? */}
        <section style={sectionCardStyle} aria-labelledby="why-heading">
          <div style={sectionHeaderStyle}>
            <div style={sectionBadgeStyle} />
            <h2 id="why-heading" style={sectionTitleStyle}>Why Choose ExplorEase?</h2>
          </div>
          <div style={cardsRowStyle}>
            <HoverCard style={{ ...cardBase }}>
              <h3 style={miniCardTitleStyle}>{icon.curated} Curated Experiences</h3>
              <p style={paragraphStyle}>
                Handpicked itineraries from vetted local experts for every travel style.
              </p>
            </HoverCard>
            <HoverCard style={{ ...cardBase }}>
              <h3 style={miniCardTitleStyle}>{icon.pricing} Transparent Pricing</h3>
              <p style={paragraphStyle}>
                No hidden fees. Clear breakdowns so you know exactly what you pay for.
              </p>
            </HoverCard>
            <HoverCard style={{ ...cardBase }}>
              <h3 style={miniCardTitleStyle}>{icon.support} 24/7 Support</h3>
              <p style={paragraphStyle}>
                Real human help, anytime, anywhere—before, during, and after your trip.
              </p>
            </HoverCard>
          </div>
        </section>

        {/* Team Introduction */}
        <section style={sectionCardStyle} aria-labelledby="team-heading">
          <div style={sectionHeaderStyle}>
            <div style={sectionBadgeStyle} />
            <h2 id="team-heading" style={sectionTitleStyle}>Meet the Team</h2>
          </div>
          <div style={gridStyle}>
            {team.map((member) => {
              const initials = member.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
              return (
                <HoverCard key={member.id} style={teamCardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={avatarStyle}>{initials}</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: '#111111' }}>{member.name}</strong>
                      <span style={{ color: primaryColor, fontWeight: 700 }}>{member.role}</span>
                    </div>
                  </div>
                  <p style={{ ...paragraphStyle, marginTop: 8 }}>{member.bio}</p>
                </HoverCard>
              );
            })}
          </div>
        </section>

        {/* Achievements & Partnerships */}
        <section style={sectionCardStyle} aria-labelledby="achievements-heading">
          <div style={sectionHeaderStyle}>
            <div style={sectionBadgeStyle} />
            <h2 id="achievements-heading" style={sectionTitleStyle}>Achievements & Partnerships</h2>
          </div>
          <div style={gridStyle}>
            {achievements.map((a) => (
              <HoverCard key={a.id} style={cardBase}>
                <p style={{ ...paragraphStyle, margin: 0, fontWeight: 700 }}>
                  {icon.trophy} {a.title}
                </p>
              </HoverCard>
            ))}
          </div>
          <div style={buttonRowStyle}>
            <button
              type="button"
              style={primaryButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(255,107,107,0.35)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Partner With Us
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;