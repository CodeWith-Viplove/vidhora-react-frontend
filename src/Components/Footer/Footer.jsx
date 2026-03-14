import React, { useEffect } from 'react';
import {
  Scale,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Send,
  ExternalLink,
  ShieldCheck,
  Award,
  Globe
} from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Chatbase integration
  useEffect(() => {
    const scriptId = "DAQqkPK_FNzocrM2QPd1l";
    
    (function () {
      if (!window.chatbase || window.chatbase("getState") !== "initialized") {
        window.chatbase = (...args) => {
          if (!window.chatbase.q) { window.chatbase.q = [] }
          window.chatbase.q.push(args)
        };
        window.chatbase = new Proxy(window.chatbase, {
          get(target, prop) {
            if (prop === "q") { return target.q }
            return (...args) => target(prop, ...args)
          }
        })
      }

      const onLoad = function () {
        if (document.getElementById(scriptId)) return;
        const script = document.createElement("script");
        script.src = "https://www.chatbase.co/embed.min.js";
        script.id = scriptId;
        script.domain = "www.chatbase.co";
        document.body.appendChild(script)
      };

      if (document.readyState === "complete") {
        onLoad()
      } else {
        window.addEventListener("load", onLoad)
      }
    })();

    // Cleanup function to remove Chatbase when component unmounts
    return () => {
      const script = document.getElementById(scriptId);
      if (script) script.remove();
      
      // Remove Chatbase created elements
      const bubbleButton = document.getElementById("chatbase-bubble-button");
      if (bubbleButton) bubbleButton.remove();
      
      const bubbleWindow = document.getElementById("chatbase-bubble-window");
      if (bubbleWindow) bubbleWindow.remove();
      
      // Fallback: look for any Chatbase iframes
      const iframes = document.querySelectorAll('iframe[src*="chatbase.co"]');
      iframes.forEach(iframe => iframe.remove());
      
      // Also check for their style tags or other containers if any
      const styles = document.querySelectorAll('style[id*="chatbase"]');
      styles.forEach(style => style.remove());
    };
  }, []);

  const companyLinks = [
    { name: 'About Us', href: '#about' },
    { name: 'Our Team', href: '#team' },
    { name: 'Contact', href: '#contact' }
  ];

  const productLinks = [
    { name: 'Law Simplifier', href: '#law-simplifier' },
    { name: 'Judgment Simplifier', href: '#judgment-simplifier' },
    { name: 'ChatBot', href: '#chatbot' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', href: '#privacy' },
    { name: 'Terms of Service', href: '#terms' },
  ];



  return (
    <footer className="footer-v2">


      <div className="footer-content-wrapper">


        <div className="footer-container main-footer-body">
          <div className="footer-grid-v2">
            {/* Brand Column */}
            <div className="footer-logo-column">
              <div className="navbar-logo" style={{ flexDirection: 'column', gap: '4px', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Scale size={28} className="scale-icon" style={{ color: '#1d4ed8' }} />
                  <span style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b" }}>VIDHORA</span>
                  {/* <span className="logo-name" style={{ fontSize: "18px", color: "#1e293b" }}>BRIDGE</span> */}
                </div>
              </div>
              <p className="brand-pitch">
                Making justice accessible through AI. We bridge the gap between complex legal systems and common understanding.
              </p>
              <div className="brand-contact-info">
                <div className="contact-link-item">
                  <Mail size={16} />
                  <span>support@vidhora.com</span>
                </div>
                <div className="contact-link-item">
                  <MapPin size={16} />
                  <span>Pune, India</span>
                </div>
              </div>

            </div>

            {/* Links Columns */}
            <div className="footer-links-group">
              <div className="link-column">
                <h4 className="column-title">Product</h4>
                <ul className="footer-links-v2">
                  {productLinks.map((link) => (
                    <li key={link.name}><a href={link.href}>{link.name}</a></li>
                  ))}
                </ul>
              </div>
              <div className="link-column">
                <h4 className="column-title">Company</h4>
                <ul className="footer-links-v2">
                  {companyLinks.map((link) => (
                    <li key={link.name}><a href={link.href}>{link.name}</a></li>
                  ))}
                </ul>
              </div>
              <div className="link-column">
                <h4 className="column-title">Legal</h4>
                <ul className="footer-links-v2">
                  {legalLinks.map((link) => (
                    <li key={link.name}><a href={link.href}>{link.name}</a></li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Newsletter Column */}
            <div className="newsletter-column">
              <h4 className="column-title">Stay Updated</h4>
              <p className="newsletter-sub">Get the latest legal insights and tool updates.</p>
              <form className="newsletter-form-v2" onSubmit={(e) => e.preventDefault()}>
                <div className="input-group-v2">
                  <input type="email" placeholder="Email address" required />
                  <button type="submit" className="newsletter-btn-v2">
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="footer-bottom-v2">
          <div className="footer-container">
            <div className="bottom-bar-inner">
              <p className="copyright-text">
                © {currentYear} VIDHORA. All rights reserved. Built with precision in India.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
