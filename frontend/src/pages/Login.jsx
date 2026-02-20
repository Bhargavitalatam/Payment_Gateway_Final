import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

function Login({ onLogin, apiUrl }) {
  const { currentTheme, toggleTheme, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: currentTheme.bgPrimary,
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    },
    bgOrb1: {
      position: 'absolute',
      width: '400px',
      height: '400px',
      borderRadius: '50%',
      background: isDark 
        ? 'radial-gradient(circle, rgba(129, 140, 248, 0.3) 0%, transparent 70%)'
        : 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
      top: '-100px',
      right: '-100px',
      animation: 'float 6s ease-in-out infinite'
    },
    bgOrb2: {
      position: 'absolute',
      width: '300px',
      height: '300px',
      borderRadius: '50%',
      background: isDark 
        ? 'radial-gradient(circle, rgba(167, 139, 250, 0.2) 0%, transparent 70%)'
        : 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
      bottom: '-50px',
      left: '-50px',
      animation: 'float 8s ease-in-out infinite reverse'
    },
    card: {
      background: currentTheme.glassBg,
      backdropFilter: currentTheme.glassBlur,
      WebkitBackdropFilter: currentTheme.glassBlur,
      borderRadius: '24px',
      padding: '48px 40px',
      width: '100%',
      maxWidth: '420px',
      boxShadow: currentTheme.glassShadow,
      border: `1px solid ${currentTheme.glassBorder}`,
      position: 'relative',
      zIndex: 1
    },
    themeToggle: {
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      background: currentTheme.cardBg,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${currentTheme.cardBorder}`,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      transition: 'all 0.3s ease',
      boxShadow: currentTheme.cardShadow
    },
    logo: {
      textAlign: 'center',
      marginBottom: '36px'
    },
    logoIcon: {
      width: '72px',
      height: '72px',
      background: currentTheme.accentGradient,
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      fontSize: '32px',
      color: 'white',
      boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: currentTheme.textPrimary,
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '15px',
      color: currentTheme.textMuted,
      marginBottom: '0'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: currentTheme.textSecondary
    },
    input: {
      padding: '16px 20px',
      background: currentTheme.inputBg,
      border: `2px solid ${currentTheme.inputBorder}`,
      borderRadius: '14px',
      fontSize: '16px',
      color: currentTheme.textPrimary,
      transition: 'all 0.3s ease',
      outline: 'none',
      backdropFilter: 'blur(5px)'
    },
    button: {
      padding: '16px',
      background: currentTheme.accentGradient,
      color: 'white',
      border: 'none',
      borderRadius: '14px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginTop: '8px',
      boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
    },
    error: {
      background: currentTheme.errorBg,
      color: currentTheme.errorText,
      padding: '14px 18px',
      borderRadius: '12px',
      fontSize: '14px',
      textAlign: 'center',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${currentTheme.errorText}20`
    },
    footer: {
      marginTop: '28px',
      textAlign: 'center',
      color: currentTheme.textMuted,
      fontSize: '13px'
    },
    footerMono: {
      fontFamily: 'monospace',
      marginTop: '6px',
      color: currentTheme.textSecondary,
      background: currentTheme.cardBg,
      padding: '8px 16px',
      borderRadius: '8px',
      display: 'inline-block'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/v1/merchant/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.description || 'Login failed');
      }

      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgOrb1}></div>
      <div style={styles.bgOrb2}></div>
      
      <button 
        style={styles.themeToggle}
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>💳</div>
          <h1 style={styles.title}>Payment Gateway</h1>
          <p style={styles.subtitle}>Merchant Dashboard</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form data-test-id="login-form" style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              data-test-id="email-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              data-test-id="password-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <button 
            data-test-id="login-button" 
            type="submit" 
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              transform: loading ? 'none' : undefined
            }}
            disabled={loading}
            onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.target.style.transform = 'none')}
          >
            {loading ? '⏳ Logging in...' : '🚀 Login'}
          </button>
        </form>

        <div style={styles.footer}>
          <p>Test credentials:</p>
          <p style={styles.footerMono}>test@example.com</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
