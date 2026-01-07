import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const { login, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(formData.email, formData.password);
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <h1 className="fb-logo">facebook</h1>
          <p className="fb-tagline">
            Facebook helps you connect and share with the people in your life.
          </p>
        </div>

        <div className="auth-right">
          <div className="auth-card">
            <form onSubmit={handleSubmit}>
              {error && <div className="auth-error">{error}</div>}

              <input
                type="email"
                name="email"
                placeholder="Email address or phone number"
                className="auth-input"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                className="auth-input"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <button
                type="submit"
                className="auth-btn login-btn"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>

              <a href="#" className="forgot-password">Forgot password?</a>

              <div className="auth-divider"></div>

              <Link to="/register" className="auth-btn create-btn">
                Create new account
              </Link>
            </form>
          </div>

          <p className="create-page-link">
            <strong>Create a Page</strong> for a celebrity, brand or business.
          </p>
        </div>
      </div>

      <footer className="auth-footer">
        <div className="footer-links">
          <a href="#">English (US)</a>
          <a href="#">Español</a>
          <a href="#">Français (France)</a>
          <a href="#">中文(简体)</a>
          <a href="#">العربية</a>
          <a href="#">Português (Brasil)</a>
          <a href="#">Italiano</a>
          <a href="#">한국어</a>
          <a href="#">Deutsch</a>
          <a href="#">हिन्दी</a>
          <a href="#">日本語</a>
        </div>
        <div className="footer-bottom">
          <a href="#">Sign Up</a>
          <a href="#">Log In</a>
          <a href="#">Messenger</a>
          <a href="#">Facebook Lite</a>
          <a href="#">Watch</a>
          <a href="#">Places</a>
          <a href="#">Games</a>
          <a href="#">Marketplace</a>
          <a href="#">Meta Pay</a>
          <a href="#">Meta Store</a>
          <a href="#">Meta Quest</a>
        </div>
        <p className="copyright">Meta © 2024</p>
      </footer>
    </div>
  );
};

export default Login;
