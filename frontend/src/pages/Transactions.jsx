import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

function Transactions({ merchant, onLogout, apiUrl }) {
  const { currentTheme, toggleTheme, isDark } = useTheme();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const styles = {
    container: {
      minHeight: '100vh',
      background: currentTheme.bgPrimary,
      position: 'relative',
      overflow: 'hidden'
    },
    bgOrb1: {
      position: 'fixed',
      width: '600px',
      height: '600px',
      borderRadius: '50%',
      background: isDark 
        ? 'radial-gradient(circle, rgba(129, 140, 248, 0.15) 0%, transparent 70%)'
        : 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
      top: '-200px',
      right: '-200px',
      pointerEvents: 'none',
      zIndex: 0
    },
    bgOrb2: {
      position: 'fixed',
      width: '500px',
      height: '500px',
      borderRadius: '50%',
      background: isDark 
        ? 'radial-gradient(circle, rgba(167, 139, 250, 0.1) 0%, transparent 70%)'
        : 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
      bottom: '-150px',
      left: '-150px',
      pointerEvents: 'none',
      zIndex: 0
    },
    navbar: {
      background: currentTheme.navbarBg,
      backdropFilter: currentTheme.glassBlur,
      WebkitBackdropFilter: currentTheme.glassBlur,
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `1px solid ${currentTheme.navbarBorder}`,
      position: 'sticky',
      top: 0,
      zIndex: 100
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontWeight: '700',
      fontSize: '20px',
      color: currentTheme.textPrimary
    },
    logoIcon: {
      width: '40px',
      height: '40px',
      background: currentTheme.accentGradient,
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      color: 'white',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
    },
    navLinks: {
      display: 'flex',
      gap: '20px',
      alignItems: 'center'
    },
    navLink: {
      textDecoration: 'none',
      color: currentTheme.textMuted,
      fontWeight: '500',
      padding: '8px 16px',
      borderRadius: '10px',
      transition: 'all 0.3s ease'
    },
    activeLink: {
      color: currentTheme.accent,
      background: currentTheme.accentLight
    },
    themeToggle: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      background: currentTheme.cardBg,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${currentTheme.cardBorder}`,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      transition: 'all 0.3s ease',
      marginRight: '12px'
    },
    logoutBtn: {
      padding: '10px 18px',
      background: currentTheme.errorBg,
      color: currentTheme.errorText,
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'all 0.3s ease'
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 24px',
      position: 'relative',
      zIndex: 1
    },
    header: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: currentTheme.textPrimary,
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    subtitle: {
      color: currentTheme.textMuted,
      fontSize: '15px'
    },
    glassCard: {
      background: currentTheme.cardBg,
      backdropFilter: currentTheme.glassBlur,
      WebkitBackdropFilter: currentTheme.glassBlur,
      borderRadius: '20px',
      padding: '28px',
      boxShadow: currentTheme.cardShadow,
      border: `1px solid ${currentTheme.cardBorder}`,
      overflow: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: '16px 18px',
      borderBottom: `2px solid ${currentTheme.divider}`,
      color: currentTheme.textMuted,
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    td: {
      padding: '18px',
      borderBottom: `1px solid ${currentTheme.divider}`,
      fontSize: '14px',
      color: currentTheme.textPrimary
    },
    statusBadge: {
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.3px'
    },
    statusSuccess: {
      background: currentTheme.successBg,
      color: currentTheme.successText
    },
    statusFailed: {
      background: currentTheme.errorBg,
      color: currentTheme.errorText
    },
    statusProcessing: {
      background: currentTheme.warningBg,
      color: currentTheme.warningText
    },
    statusCreated: {
      background: currentTheme.infoBg,
      color: currentTheme.infoText
    },
    methodBadge: {
      padding: '6px 14px',
      borderRadius: '8px',
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      background: currentTheme.inputBg,
      color: currentTheme.textSecondary,
      border: `1px solid ${currentTheme.inputBorder}`
    },
    emptyState: {
      textAlign: 'center',
      padding: '80px 20px',
      color: currentTheme.textMuted
    },
    emptyIcon: {
      fontSize: '64px',
      marginBottom: '20px',
      opacity: 0.5
    },
    emptyTitle: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '10px',
      color: currentTheme.textSecondary
    },
    loading: {
      textAlign: 'center',
      padding: '80px 20px',
      color: currentTheme.textMuted
    },
    loadingSpinner: {
      width: '48px',
      height: '48px',
      border: `4px solid ${currentTheme.cardBorder}`,
      borderTop: `4px solid ${currentTheme.accent}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 20px'
    },
    monospace: {
      fontFamily: 'monospace',
      fontSize: '13px',
      background: currentTheme.inputBg,
      padding: '6px 12px',
      borderRadius: '8px',
      border: `1px solid ${currentTheme.inputBorder}`
    }
  };

  // Add spinner animation
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/payments`, {
          headers: {
            'X-Api-Key': merchant.api_key,
            'X-Api-Secret': merchant.api_secret
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPayments(data.payments || []);
        }
      } catch (err) {
        console.error('Failed to fetch payments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchPayments, 5000);
    return () => clearInterval(interval);
  }, [apiUrl, merchant.api_key, merchant.api_secret]);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount / 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '-');
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'success':
        return { ...styles.statusBadge, ...styles.statusSuccess };
      case 'failed':
        return { ...styles.statusBadge, ...styles.statusFailed };
      case 'processing':
        return { ...styles.statusBadge, ...styles.statusProcessing };
      default:
        return { ...styles.statusBadge, ...styles.statusCreated };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'processing': return '⏳';
      default: return '📝';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgOrb1}></div>
      <div style={styles.bgOrb2}></div>

      <nav style={styles.navbar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>💳</div>
          <span>Payment Gateway</span>
        </div>
        <div style={styles.navLinks}>
          <Link to="/dashboard" style={styles.navLink}>Dashboard</Link>
          <Link to="/dashboard/transactions" style={{...styles.navLink, ...styles.activeLink}}>Transactions</Link>
          <button style={styles.themeToggle} onClick={toggleTheme} title="Toggle theme">
            {isDark ? '☀️' : '🌙'}
          </button>
          <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📊 Transactions</h1>
          <p style={styles.subtitle}>View all your payment transactions in real-time</p>
        </div>

        <div style={styles.glassCard}>
          {loading ? (
            <div style={styles.loading}>
              <div style={styles.loadingSpinner}></div>
              <p>Loading transactions...</p>
            </div>
          ) : payments.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <p style={styles.emptyTitle}>No transactions yet</p>
              <p>Transactions will appear here once payments are made.</p>
            </div>
          ) : (
            <table data-test-id="transactions-table" style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Payment ID</th>
                  <th style={styles.th}>Order ID</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Method</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Created</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr 
                    key={payment.id} 
                    data-test-id="transaction-row" 
                    data-payment-id={payment.id}
                  >
                    <td data-test-id="payment-id" style={styles.td}>
                      <span style={styles.monospace}>{payment.id}</span>
                    </td>
                    <td data-test-id="order-id" style={styles.td}>
                      <span style={styles.monospace}>{payment.order_id}</span>
                    </td>
                    <td data-test-id="amount" style={styles.td}>
                      <strong>{formatAmount(payment.amount)}</strong>
                    </td>
                    <td data-test-id="method" style={styles.td}>
                      <span style={styles.methodBadge}>
                        {payment.method === 'upi' ? '📱 ' : '💳 '}{payment.method}
                      </span>
                    </td>
                    <td data-test-id="status" style={styles.td}>
                      <span style={getStatusStyle(payment.status)}>
                        {getStatusIcon(payment.status)} {payment.status}
                      </span>
                    </td>
                    <td data-test-id="created-at" style={styles.td}>
                      {formatDate(payment.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Transactions;
