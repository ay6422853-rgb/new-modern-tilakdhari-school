import { Link } from "react-router-dom";
import "./home.css";

export default function Home() {
  return (
    <div className="home-page">

      {/* NAVBAR */}
      <header className="public-nav">
        <div className="school-logo">
          <div className="logo-icon">🏫</div>

          <div className="school-brand">
            <strong>New Modern TD IC</strong>
            <small>Learn • Grow • Lead</small>
          </div>
        </div>

        <nav>
          <a href="#about">About</a>
          <a href="#academics">Academics</a>
          <a href="#facilities">Facilities</a>

          <Link className="nav-login" to="/login">
            School Portal
          </Link>
        </nav>
      </header>


      {/* HERO */}
      <section className="hero-section">

        <div className="hero-overlay"></div>

        <div className="hero-content">

          <span className="welcome-text">
            WELCOME TO
          </span>

          <h1>
            New Modern Tilakdhari
            <br />
            <span>Inter College</span>
          </h1>

          <p>
            Inspiring young minds through quality education,
            strong values and a learning environment where every
            student gets the opportunity to grow and succeed.
          </p>

          <div className="hero-buttons">

            <Link className="primary-btn" to="/login">
              Open School Portal
              <span>→</span>
            </Link>

            <a className="secondary-btn" href="#about">
              Discover Our School
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

        <div className="info-heading">
          <span className="section-label">
            ABOUT OUR SCHOOL
          </span>

          <h2>
            Education that builds knowledge,
            <span> values and confidence.</span>
          </h2>
        </div>

        <div className="info-content">
          <p>
            New Modern Tilakdhari Inter College is committed to
            providing students with a strong academic foundation
            along with discipline, confidence and character.
          </p>

          <p>
            Our aim is to create a positive learning environment
            where students can discover their potential, develop
            essential skills and prepare themselves for the future.
          </p>
        </div>

      </section>


      {/* FEATURES */}
      <section className="feature-wrapper" id="academics">

        <div className="feature-heading">
          <span className="section-label">
            WHY CHOOSE US
          </span>

          <h2>
            A learning environment designed
            <br />
            <span>for every student's growth.</span>
          </h2>
        </div>


        <div className="feature-section">

          {/* FEATURE 1 */}
          <div className="feature-card">

            <div className="feature-top">
              <div className="feature-icon">
                📚
              </div>

              <span className="feature-number">
                01
              </span>
            </div>

            <h3>
              Quality Education
            </h3>

            <p>
              Strong academic learning with a focus on clear
              concepts, regular practice and overall student
              development.
            </p>

            <span className="feature-line"></span>

          </div>


          {/* FEATURE 2 */}
          <div className="feature-card">

            <div className="feature-top">
              <div className="feature-icon">
                👨‍🏫
              </div>

              <span className="feature-number">
                02
              </span>
            </div>

            <h3>
              Expert Teachers
            </h3>

            <p>
              Experienced and dedicated teachers who guide
              students with care, discipline and individual
              attention.
            </p>

            <span className="feature-line"></span>

          </div>


          {/* FEATURE 3 */}
          <div className="feature-card">

            <div className="feature-top">
              <div className="feature-icon">
                💻
              </div>

              <span className="feature-number">
                03
              </span>
            </div>

            <h3>
              Digital Campus
            </h3>

            <p>
              Modern digital management connecting school
              administration, students, parents and academic
              activities in one place.
            </p>

            <span className="feature-line"></span>

          </div>

        </div>

      </section>


      {/* CAMPUS */}
      <section className="facilities-section" id="facilities">

        <div className="campus-content">

          <span className="section-label">
            OUR CAMPUS
          </span>

          <h2>
            A place to learn,
            <br />
            <span>grow and achieve.</span>
          </h2>

          <p>
            A welcoming campus that provides students with
            a comfortable environment for education, activities
            and personal development.
          </p>

        </div>

        <Link className="campus-btn" to="/login">
          Enter School Portal
          <span>→</span>
        </Link>

      </section>


      {/* FOOTER */}
      <footer className="school-footer">

        <div>
          <strong>New Modern TD IC</strong>
          <span>New Modern Tilakdhari Inter College</span>
        </div>

        <p>
          © {new Date().getFullYear()} New Modern Tilakdhari Inter College.
          All Rights Reserved.
        </p>

      </footer>

    </div>
  );
}