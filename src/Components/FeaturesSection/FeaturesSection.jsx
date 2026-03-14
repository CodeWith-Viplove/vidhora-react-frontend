import React, { useRef, useState, useEffect } from 'react';
import { Scale, ScrollText, MessageSquareQuote, ShieldCheck, Clock, Users } from 'lucide-react';
import './FeaturesSection.css';

/* ── animated counter hook ─────────────────────────────────── */
function useCountUp(target, duration = 1800, started = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;

    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return count;
}

/* ── stat item ─────────────────────────────────────────────── */
function StatItem({ target, suffix, label, started, duration }) {
  const count = useCountUp(target, duration, started);
  return (
    <div className="stat-item">
      <span className="stat-value">
        {count}{suffix}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

/* ── main component ────────────────────────────────────────── */
const FeaturesSection = () => {
  const statsRef = useRef(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animating) {
          setAnimating(true);
        }
      },
      { threshold: 0.4 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [animating]);

  const features = [
    {
      id: 1,
      icon: <Scale size={32} />,
      title: 'Law Simplifier',
      description: 'Breaks down dense legal acts and clauses into simple, actionable insights anyone can understand.',
    },
    {
      id: 2,
      icon: <ScrollText size={32} />,
      title: 'Instant Judgment Summaries',
      description: 'Summarizes complex court orders and case files into clear, concise executive summaries in seconds.',
    },
    {
      id: 3,
      icon: <MessageSquareQuote size={32} />,
      title: 'Vidhora Chat Assistant',
      description: 'Ask any legal question and get precise, context-aware answers from your dedicated digital assistant.',
    },
    {
      id: 4,
      icon: <ShieldCheck size={32} />,
      title: 'Secure & Private',
      description: 'Your documents are end-to-end encrypted and never stored beyond your session.',
    },
    {
      id: 5,
      icon: <Clock size={32} />,
      title: '24/7 Availability',
      description: 'Access legal assistance anytime, anywhere - no appointments, no waiting rooms.',
    },
    {
      id: 6,
      icon: <Users size={32} />,
      title: 'Built for Everyone',
      description: 'Designed for students, professionals, and citizens who deserve clear legal understanding.',
    },
  ];

  return (
    <section className="features-section">
      <div className="features-background">
        <div className="background-pattern"></div>
        <div className="background-gradient"></div>
      </div>

      <div className="features-container">
        {/* Section Header */}
        <div className="features-header">
          <h2 className="features-title">
            Powerful Legal Tools at Your Fingertips
          </h2>
          <p className="features-description">
            Our AI-powered suite helps you navigate complex legal documents, understand court
            judgments, and get instant legal assistance — no expertise required.
          </p>
        </div>

        {/* Stats Row — triggers count-up on scroll */}
        <div className="features-stats" ref={statsRef}>
          <StatItem target={95} suffix="%" label="Accuracy Rate" started={animating} duration={1600} />
          <StatItem target={3} suffix="" label="Powerful Tools" started={animating} duration={900} />
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="feature-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon-box">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
