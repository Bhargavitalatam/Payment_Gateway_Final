import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

function Dashboard({ merchant, onLogout, apiUrl }) {
  const { currentTheme, toggleTheme, isDark } = useTheme();
  const [stats, setStats] = useState({
    total_transactions: 0,
    total_amount: 0,
    success_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  
  // Order form state
  const [amount, setAmount] = useState('');
  const [receipt, setReceipt] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [description, setDescription] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const checkoutBaseUrl = 'http://localhost:3001';

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
    welcomeText: {
      fontSize: '32px',
      fontWeight: '700',
      color: currentTheme.textPrimary,
      marginBottom: '8px'
    },
    subText: {
      color: currentTheme.textMuted,
      fontSize: '15px'
    },
    glassCard: {
      background: currentTheme.cardBg,
      backdropFilter: currentTheme.glassBlur,
      WebkitBackdropFilter: currentTheme.glassBlur,
      borderRadius: '20px',
      padding: '28px',
      marginBottom: '24px',
      boxShadow: currentTheme.cardShadow,
      border: `1px solid ${currentTheme.cardBorder}`,
      transition: 'all 0.3s ease'
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: currentTheme.textPrimary,
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '24px'
    },
    statCard: {
      background: currentTheme.cardBg,
      backdropFilter: currentTheme.glassBlur,
      WebkitBackdropFilter: currentTheme.glassBlur,
      borderRadius: '20px',
      padding: '28px',
      boxShadow: currentTheme.cardShadow,
      border: `1px solid ${currentTheme.cardBorder}`,
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    statDecor: {
      position: 'absolute',
      top: '-20px',
      right: '-20px',
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      background: currentTheme.accentLight,
      opacity: 0.5
    },
    statLabel: {
      fontSize: '14px',
      color: currentTheme.textMuted,
      marginBottom: '10px',
      fontWeight: '500'
    },
    statValue: {
      fontSize: '36px',
      fontWeight: '700',
      color: currentTheme.textPrimary,
      position: 'relative',
      zIndex: 1
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '16px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '13px',
      fontWeight: '600',
      color: currentTheme.textSecondary
    },
    input: {
      padding: '14px 18px',
      background: currentTheme.inputBg,
      border: `2px solid ${currentTheme.inputBorder}`,
      borderRadius: '12px',
      fontSize: '14px',
      color: currentTheme.textPrimary,
      outline: 'none',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(5px)'
    },
    textarea: {
      padding: '14px 18px',
      background: currentTheme.inputBg,
      border: `2px solid ${currentTheme.inputBorder}`,
      borderRadius: '12px',
      fontSize: '14px',
      color: currentTheme.textPrimary,
      outline: 'none',
      resize: 'vertical',
      minHeight: '90px',
      fontFamily: 'inherit',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(5px)'
    },
    createButton: {
      padding: '14px 28px',
      background: currentTheme.accentGradient,
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
      transition: 'all 0.3s ease'
    },
    orderResult: {
      marginTop: '24px',
      padding: '24px',
      background: currentTheme.successBg,
      borderRadius: '16px',
      border: `1px solid ${currentTheme.successText}30`
    },
    orderResultTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: currentTheme.successText,
      marginBottom: '16px'
    },
    orderResultItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: `1px solid ${currentTheme.successText}20`
    },
    orderResultLabel: {
      fontSize: '13px',
      color: currentTheme.successText
    },
    orderResultValue: {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: currentTheme.successText,
      fontWeight: '600',
      background: `${currentTheme.successText}15`,
      padding: '6px 12px',
      borderRadius: '8px'
    },
    checkoutLinkBox: {
      marginTop: '20px',
      padding: '16px',
      background: `${currentTheme.successText}10`,
      borderRadius: '12px'
    },
    checkoutLink: {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: currentTheme.successText,
      wordBreak: 'break-all',
      background: currentTheme.cardBg,
      padding: '12px',
      borderRadius: '10px',
      border: `1px solid ${currentTheme.successText}30`,
      marginTop: '10px',
      display: 'block'
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      marginTop: '14px'
    },
    copyButton: {
      padding: '10px 20px',
      background: currentTheme.successText,
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    openButton: {
      padding: '10px 20px',
      background: currentTheme.accentGradient,
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.3s ease'
    },
    credentialItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 0',
      borderBottom: `1px solid ${currentTheme.divider}`
    },
    credentialLabel: {
      fontSize: '14px',
      color: currentTheme.textMuted,
      fontWeight: '500'
    },
    credentialValue: {
      fontFamily: 'monospace',
      fontSize: '14px',
      background: currentTheme.inputBg,
      padding: '8px 16px',
      borderRadius: '10px',
      color: currentTheme.textPrimary,
      border: `1px solid ${currentTheme.inputBorder}`
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: '14px 18px',
      borderBottom: `2px solid ${currentTheme.divider}`,
      color: currentTheme.textMuted,
      fontSize: '12px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    td: {
      padding: '16px 18px',
      borderBottom: `1px solid ${currentTheme.divider}`,
      fontSize: '13px',
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
    statusCreated: {
      background: currentTheme.infoBg,
      color: currentTheme.infoText
    },
    statusPaid: {
      background: currentTheme.successBg,
      color: currentTheme.successText
    },
    actionButton: {
      padding: '8px 16px',
      background: currentTheme.accentGradient,
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      textDecoration: 'none',
      transition: 'all 0.3s ease'
    },
    errorMessage: {
      padding: '14px 18px',
      background: currentTheme.errorBg,
      color: currentTheme.errorText,
      borderRadius: '12px',
      fontSize: '14px',
      marginBottom: '20px',
      border: `1px solid ${currentTheme.errorText}30`
    },
    codeBlock: {
      background: isDark ? '#1a1a2e' : '#1e1e2e',
      borderRadius: '12px',
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#e0e0e0',
      overflow: 'auto',
      border: `1px solid ${currentTheme.cardBorder}`
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/merchant/stats`, {
        headers: {
          'X-Api-Key': merchant.api_key,
          'X-Api-Secret': merchant.api_secret
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, merchant.api_key, merchant.api_secret]);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/orders`, {
        headers: {
          'X-Api-Key': merchant.api_key,
          'X-Api-Secret': merchant.api_secret
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, [apiUrl, merchant.api_key, merchant.api_secret]);

  useEffect(() => {
    fetchStats();
    fetchOrders();
    
    const interval = setInterval(() => {
      fetchStats();
      fetchOrders();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchStats, fetchOrders]);

  const createOrder = async (e) => {
    e.preventDefault();
    setError('');
    setCreatedOrder(null);
    setCreatingOrder(true);

    const amountInPaise = Math.round(parseFloat(amount) * 100);

    if (isNaN(amountInPaise) || amountInPaise < 100) {
      setError('Amount must be at least ₹1.00');
      setCreatingOrder(false);
      return;
    }

    try {
      const notes = {};
      if (customerName) notes.customer_name = customerName;
      if (customerEmail) notes.customer_email = customerEmail;
      if (description) notes.description = description;

      const response = await fetch(`${apiUrl}/api/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': merchant.api_key,
          'X-Api-Secret': merchant.api_secret
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: receipt || undefined,
          notes: Object.keys(notes).length > 0 ? notes : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.description || 'Failed to create order');
      }

      setCreatedOrder(data);
      fetchOrders();
      
      setAmount('');
      setReceipt('');
      setCustomerName('');
      setCustomerEmail('');
      setDescription('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingOrder(false);
    }
  };

  const copyCheckoutLink = () => {
    if (createdOrder) {
      const link = `${checkoutBaseUrl}/checkout?order_id=${createdOrder.id}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount / 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusStyle = (status) => {
    if (status === 'paid') {
      return { ...styles.statusBadge, ...styles.statusPaid };
    }
    return { ...styles.statusBadge, ...styles.statusCreated };
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
          <Link to="/dashboard" style={{...styles.navLink, ...styles.activeLink}}>Dashboard</Link>
          <Link to="/dashboard/transactions" style={styles.navLink}>Transactions</Link>
          <button style={styles.themeToggle} onClick={toggleTheme} title="Toggle theme">
            {isDark ? '☀️' : '🌙'}
          </button>
          <button style={styles.logoutBtn} onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <div data-test-id="dashboard" style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.welcomeText}>Welcome, {merchant.name} 👋</h1>
          <p style={styles.subText}>{merchant.email}</p>
        </div>

        {/* Stats Grid */}
        <div data-test-id="stats-container" style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statDecor}></div>
            <p style={styles.statLabel}>📊 Total Transactions</p>
            <p data-test-id="total-transactions" style={styles.statValue}>
              {loading ? '...' : stats.total_transactions}
            </p>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statDecor}></div>
            <p style={styles.statLabel}>💰 Total Amount</p>
            <p data-test-id="total-amount" style={styles.statValue}>
              {loading ? '...' : formatAmount(stats.total_amount)}
            </p>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statDecor}></div>
            <p style={styles.statLabel}>✅ Success Rate</p>
            <p data-test-id="success-rate" style={styles.statValue}>
              {loading ? '...' : `${stats.success_rate}%`}
            </p>
          </div>
        </div>

        {/* API Credentials - Show First */}
        <div data-test-id="api-credentials" style={styles.glassCard}>
          <h2 style={styles.cardTitle}>🔑 API Credentials</h2>
          <p style={{ color: currentTheme.textMuted, fontSize: '14px', marginBottom: '20px' }}>
            Use these credentials to authenticate your API requests.
          </p>
          {(!merchant.api_key || !merchant.api_secret) ? (
            <div style={styles.errorMessage}>
              ⚠️ API credentials not found. Please logout and login again to refresh your credentials.
            </div>
          ) : (
            <>
              <div style={styles.credentialItem}>
                <label style={styles.credentialLabel}>API Key</label>
                <span data-test-id="api-key" style={styles.credentialValue}>{merchant.api_key}</span>
              </div>
              <div style={{...styles.credentialItem, borderBottom: 'none'}}>
                <label style={styles.credentialLabel}>API Secret</label>
                <span data-test-id="api-secret" style={styles.credentialValue}>{merchant.api_secret}</span>
              </div>
            </>
          )}
        </div>

        {/* Create Payment Order Section */}
        <div style={styles.glassCard}>
          <h2 style={styles.cardTitle}>🚀 Create Payment Order</h2>
          <p style={{ color: currentTheme.textMuted, fontSize: '14px', marginBottom: '24px' }}>
            Generate a payment link to collect payments from your customers.
          </p>

          {error && <div style={styles.errorMessage}>{error}</div>}

          <form onSubmit={createOrder}>
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="500.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Receipt ID</label>
                <input
                  type="text"
                  placeholder="INV-001"
                  value={receipt}
                  onChange={(e) => setReceipt(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Customer Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Customer Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
            <div style={{ ...styles.inputGroup, marginBottom: '20px' }}>
              <label style={styles.label}>Description</label>
              <textarea
                placeholder="Payment for Order #123"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={styles.textarea}
              />
            </div>
            <button 
              type="submit" 
              style={{
                ...styles.createButton,
                opacity: creatingOrder ? 0.7 : 1,
                cursor: creatingOrder ? 'not-allowed' : 'pointer'
              }}
              disabled={creatingOrder}
            >
              {creatingOrder ? '⏳ Creating...' : '✨ Create Payment Order'}
            </button>
          </form>

          {/* Created Order Result */}
          {createdOrder && (
            <div style={styles.orderResult}>
              <div style={styles.orderResultTitle}>✅ Order Created Successfully!</div>
              <div style={styles.orderResultItem}>
                <span style={styles.orderResultLabel}>Order ID</span>
                <span style={styles.orderResultValue}>{createdOrder.id}</span>
              </div>
              <div style={styles.orderResultItem}>
                <span style={styles.orderResultLabel}>Amount</span>
                <span style={styles.orderResultValue}>{formatAmount(createdOrder.amount)}</span>
              </div>
              <div style={{...styles.orderResultItem, borderBottom: 'none'}}>
                <span style={styles.orderResultLabel}>Status</span>
                <span style={styles.orderResultValue}>{createdOrder.status}</span>
              </div>
              
              <div style={styles.checkoutLinkBox}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: currentTheme.successText }}>
                  🔗 Checkout Link:
                </span>
                <div style={styles.checkoutLink}>
                  {checkoutBaseUrl}/checkout?order_id={createdOrder.id}
                </div>
                <div style={styles.buttonGroup}>
                  <button onClick={copyCheckoutLink} style={styles.copyButton}>
                    {copied ? '✓ Copied!' : '📋 Copy Link'}
                  </button>
                  <a 
                    href={`${checkoutBaseUrl}/checkout?order_id=${createdOrder.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.openButton}
                  >
                    Open Checkout →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div style={styles.glassCard}>
          <h2 style={styles.cardTitle}>📋 Recent Orders</h2>
          {orders.length === 0 ? (
            <p style={{ color: currentTheme.textMuted, fontSize: '14px', textAlign: 'center', padding: '30px' }}>
              No orders yet. Create your first payment order above! 🎉
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Order ID</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Created</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((order) => (
                    <tr key={order.id}>
                      <td style={styles.td}>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{order.id}</span>
                      </td>
                      <td style={styles.td}>{formatAmount(order.amount)}</td>
                      <td style={styles.td}>
                        <span style={getStatusStyle(order.status)}>{order.status}</span>
                      </td>
                      <td style={styles.td}>{formatDate(order.created_at)}</td>
                      <td style={styles.td}>
                        {order.status !== 'paid' && (
                          <a 
                            href={`${checkoutBaseUrl}/checkout?order_id=${order.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.actionButton}
                          >
                            Pay Now
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Start Guide */}
        <div style={styles.glassCard}>
          <h2 style={styles.cardTitle}>📚 API Integration</h2>
          <p style={{ color: currentTheme.textMuted, fontSize: '14px', marginBottom: '20px' }}>
            Use the API to integrate payments into your application programmatically.
          </p>
          <div style={styles.codeBlock}>
            <pre style={{ margin: 0 }}>{`# Create Order
curl -X POST http://localhost:8000/api/v1/orders \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: ${merchant.api_key}" \\
  -H "X-Api-Secret: ${merchant.api_secret}" \\
  -d '{"amount": 50000, "currency": "INR"}'

# Create Payment (UPI)
curl -X POST http://localhost:8000/api/v1/payments \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: ${merchant.api_key}" \\
  -H "X-Api-Secret: ${merchant.api_secret}" \\
  -d '{"order_id": "<order_id>", "method": "upi", "vpa": "user@paytm"}'`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
