import React from "react";
import Navbar from "../../Components/Navbar/Navbar";
import HeroSection from "../../Components/HeroSection/HeroSection";
import LegalToolsSection from "../../Components/LegalToolsSection/LegalToolsSection";
import FeaturesSection from "../../Components/FeaturesSection/FeaturesSection";
import Footer from "../../Components/Footer/Footer";
// import LoginPage from "../LoginPage/LoginPage";

const LandingPage = () => {
  return (
    <div className="lex-landing-page">
      <div className="lex-landing-page-content">
        <Navbar/>
        <HeroSection/>
        <div id="tools"><LegalToolsSection/></div>
        <div id="features"><FeaturesSection/></div>
        <Footer/>
        {/* <LoginPage/> */}
      </div>
    </div>
  );
};

export default LandingPage;
