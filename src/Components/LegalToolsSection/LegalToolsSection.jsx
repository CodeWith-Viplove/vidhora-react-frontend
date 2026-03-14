import React from 'react';
import { Scale, FileText, MessageCircle } from 'lucide-react';
import './LegalToolsSection.css';

const LegalToolsSection = () => {
  const tools = [
    {
      id: 1,
      icon: <Scale size={32} />,
      title: 'Law Simplifier',
      description: 'Transform complex legal language into simple, understandable terms',
      features: [
        'Instant legal text simplification',
        'Side-by-side comparison',
        'Real-world examples',
        // 'Download simplified versions'
      ],
      buttonText: 'Open Module'
    },
    {
      id: 2,
      icon: <FileText size={32} />,
      title: 'Judgment Simplifier',
      description: 'Get clear bullet-point summaries of court judgments',
      features: [
        'Upload PDF judgments',
        'Key points extraction',
        'Case impact analysis',
        // 'Download summaries'
      ],
      buttonText: 'Open Module'
    },
    {
      id: 3,
      icon: <MessageCircle size={32} />,
      title: 'Legal Chatbot',
      description: 'Ask any legal question and get instant, AI-powered answers',
      features: [
        'Ask legal questions in plain English',
        'Instant AI responses',
        'Case law references',
      ],
      buttonText: 'Open Module'
    }
  ];

  return (
    <section className="legal-tools-section">
      <div className="legal-tools-container">
        <div className="section-header">
          <div className="header-accent"></div>
          <h2 className="sectionLe-title">Choose Your Legal Tool</h2>
          <p className="section-description">
            Select from our three powerful modules to simplify your legal needs
          </p>
        </div>

        <div className="tools-grid">
          {tools.map((tool) => (
            <div key={tool.id} className="tool-card">
              <div className="tool-header">
                <div className="tool-icon">
                  {tool.icon}
                </div>
                <h3 className="tool-title">{tool.title}</h3>
                <h6 className="tool-description">{tool.description}</h6>
              </div>

              <div className="tool-features">
                {tool.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <div className="feature-bullet"></div>
                    <span className="feature-text">{feature}</span>
                  </div>
                ))}
              </div>

              <button className="tool-button">
                {tool.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LegalToolsSection;
