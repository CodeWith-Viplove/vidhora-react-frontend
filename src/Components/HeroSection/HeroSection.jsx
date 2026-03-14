import React from 'react';
import { Scale, Sparkles, Shield, BookOpen, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './HeroSection.css';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="hero-premium">
      {/* ── Background Layers ── */}
      <div className="hero-visual-bg">
        <div className="aurora-blob aurora-1" />
        <div className="aurora-blob aurora-2" />
        <div className="aurora-blob aurora-3" />
        <div className="hero-grid" />
        <div className="hero-noise" />
      </div>

      <div className="hero-premium-container">

        {/* ── Badge ── */}
        <div className="hero-featured-badge">
          <span className="badge-dot" />
          AI-Powered · Trusted by Thousands
        </div>

        {/* ── Headline ── */}
        <h1 className="hero-premium-title">
          Making Law Simple,<br />
          Reliable &amp; <span className="hero-gold-text">Accessible</span>
        </h1>

        {/* ── Subtext ── */}
        <p className="hero-premium-description">
          Transform complex legal language into clear terms, summarize court judgments,
          and generate accurate documents — all powered by AI-precision built for everyone.
        </p>

        {/* ── Actions ── */}
        <div className="hero-premium-actions">
          <button className="hero-btn-gold" onClick={() => navigate('/login')}>
            Get Started Free
          </button>
          <button className="hero-btn-outline" onClick={() => navigate('/login')}>
            Explore Features
          </button>
        </div>

        {/* ── Central Graphic ── */}


        {/* ── Stats Bar ── */}
        {/* <div className="hero-stats-grid">
          <div className="stat-item">
            <span className="stat-value">10K+</span>
            <span className="stat-label">Cases Simplified</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">50K+</span>
            <span className="stat-label">Documents Created</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">99%</span>
            <span className="stat-label">Response Accuracy</span>
          </div>
        </div> */}

      </div>
    </section>
  );
};

export default HeroSection;