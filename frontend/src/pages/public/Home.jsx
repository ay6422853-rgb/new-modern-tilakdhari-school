import { Link } from "react-router-dom";
import "./home.css";

export default function Home() {
  return (
    <div className="home-page">

      {/* NAVBAR */}
      <header className="public-nav">
        <div className="school-logo">
          <span className="logo-icon">🏫</span>

          <div>
            <strong>EduSphere School</strong>
            <small>Learn • Grow • Lead</small>
          </div>
        </div>

        <nav>
          <a href="#about">About</a>
          <a href="#academics">Academics</a>
          <a href="#facilities">Facilities</a>

          <Link className="nav-login" to="/login">
            Portal Login
          </Link>
        </nav>
      </header>


      {/* HERO */}
      <section className="hero-section">

        <div className="hero-overlay"></div>

        <div className="hero-content">

            <h1>New Modern Tilakdhari<br/> Inter College</h1>

          <span className="welcome-text">
            WELCOME TO OUR SCHOOL
          </span>

          <h1>
            Learning Today.
            <br />
            <span>Leading Tomorrow.</span>
          </h1>

          <p>
            A modern school committed to quality education,
            character building and preparing students for a brighter future.
          </p>

          <div className="hero-buttons">

            <Link className="primary-btn" to="/login">
              Open School Portal
              <span>→</span>
            </Link>

            <a className="secondary-btn" href="#about">
              Explore School
            </a>

          </div>

        </div>

        <div className="hero-scroll">
          <span>Scroll to explore</span>
          <span>↓</span>
        </div>

      </section>


      {/* ABOUT */}
      <section className="info-section" id="about">

        <div>
          <span className="section-label">
            ABOUT OUR SCHOOL
          </span>

          <h2>
            Building knowledge, confidence and character.
          </h2>
        </div>

        <p>
          EduSphere School provides a modern learning environment
          where students can develop academically, socially and creatively.
          Our digital school platform connects administrators, teachers,
          students and parents in one place.
        </p>

      </section>


      {/* FEATURES */}
      <section className="feature-section" id="academics">

        <div className="feature-card">

          <div className="feature-icon">
            📚
          </div>

          <h3>
            Quality Education
          </h3>

          <p>
            Structured academics designed to help every student
            learn and grow.
          </p>

        </div>


        <div className="feature-card">

          <div className="feature-icon">
            👨‍🏫
          </div>

          <h3>
            Expert Teachers
          </h3>

          <p>
            Dedicated teachers focused on student development
            and achievement.
          </p>

        </div>


        <div className="feature-card">

          <div className="feature-icon">
            💻
          </div>

          <h3>
            Digital Campus
          </h3>

          <p>
            Smart digital management for students, parents,
            teachers and school administration.
          </p>

        </div>

      </section>


      {/* CAMPUS */}
      <section className="facilities-section" id="facilities">

        <div>

          <span className="section-label">
            OUR CAMPUS
          </span>

          <h2>
            A place where students love to learn.
          </h2>

        </div>

        <Link className="campus-btn" to="/login">
          Enter School Portal →
        </Link>

      </section>

    </div>
  );
}