import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    birthday: '',
    gender: ''
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
    const result = await register(formData);
    setLoading(false);
    if (result.success) {
      navigate('/');
    }
  };

  // Generate date options
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="auth-page register-page">
      <div className="register-container">
        <div className="register-header">
          <Link to="/login" className="fb-logo-small">facebook</Link>
        </div>

        <div className="register-card">
          <div className="register-card-header">
            <h1>Create a new account</h1>
            <p>It's quick and easy.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="name-inputs">
              <input
                type="text"
                name="firstName"
                placeholder="First name"
                className="auth-input"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                className="auth-input"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <input
              type="email"
              name="email"
              placeholder="Email address"
              className="auth-input"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="New password"
              className="auth-input"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              required
            />

            <div className="form-section">
              <label className="section-label">Birthday</label>
              <div className="date-selects">
                <select name="day" className="date-select" required>
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <select name="month" className="date-select" required>
                  {months.map((month, index) => (
                    <option key={month} value={index + 1}>{month}</option>
                  ))}
                </select>
                <select name="year" className="date-select" required>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-section">
              <label className="section-label">Gender</label>
              <div className="gender-options">
                <label className="gender-option">
                  <span>Female</span>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    onChange={handleChange}
                    required
                  />
                </label>
                <label className="gender-option">
                  <span>Male</span>
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    onChange={handleChange}
                  />
                </label>
                <label className="gender-option">
                  <span>Custom</span>
                  <input
                    type="radio"
                    name="gender"
                    value="other"
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>

            <p className="terms-text">
              People who use our service may have uploaded your contact information to Facebook.{' '}
              <a href="#">Learn more</a>.
            </p>

            <p className="terms-text">
              By clicking Sign Up, you agree to our <a href="#">Terms</a>,{' '}
              <a href="#">Privacy Policy</a> and <a href="#">Cookies Policy</a>.
              You may receive SMS notifications from us and can opt out at any time.
            </p>

            <button
              type="submit"
              className="auth-btn signup-btn"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>

            <Link to="/login" className="already-have-account">
              Already have an account?
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
