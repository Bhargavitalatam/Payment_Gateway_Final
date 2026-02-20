import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function Checkout() {
  const { currentTheme, toggleTheme, isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  
  // Form states
  const [vpa, setVpa] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  
  // Payment states
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentError, setPaymentError] = useState('');

  const styles = {
    container: {
      minHeight: '100vh',
      background: currentTheme.bgPrimary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    },
    bgOrb1: {
      position: 'absolute',
      width: '500px',
      height: '500px',
      borderRadius: '50%',
      background: isDark 
        ? 'radial-gradient(circle, rgba(129, 140, 248, 0.2) 0%, transparent 70%)'
        : 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
      top: '-150px',
      right: '-150px',
      animation: 'float 6s ease-in-out infinite'
    },
    bgOrb2: {
      position: 'absolute',
      width: '400px',
      height: '400px',
      borderRadius: '50%',
      background: isDark 
        ? 'radial-gradient(circle, rgba(167, 139, 250, 0.15) 0%, transparent 70%)'
        : 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
      bottom: '-100px',
      left: '-100px',
      animation: 'float 8s ease-in-out infinite reverse'
    },
    themeToggle: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '48px',
      height: '48px',
      borderRadius: '14px',
      background: currentTheme.cardBg,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: `1px solid ${currentTheme.cardBorder}`,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '22px',
      transition: 'all 0.3s ease',
      boxShadow: currentTheme.cardShadow,
      zIndex: 100
    },
    card: {
      background: currentTheme.glassBg,
      backdropFilter: currentTheme.glassBlur,
      WebkitBackdropFilter: currentTheme.glassBlur,
      borderRadius: '24px',
      width: '100%',
      maxWidth: '480px',
      boxShadow: currentTheme.glassShadow,
      border: `1px solid ${currentTheme.glassBorder}`,
      overflow: 'hidden',
      position: 'relative',
      zIndex: 1
    },
    header: {
      background: currentTheme.accentGradient,
      padding: '32px',
      color: 'white',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    },
    headerDecor: {
      position: 'absolute',
      width: '200px',
      height: '200px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.1)',
      top: '-100px',
      right: '-50px'
    },
    headerTitle: {
      fontSize: '15px',
      fontWeight: '500',
      marginBottom: '10px',
      opacity: '0.9',
      position: 'relative',
      zIndex: 1
    },
    headerAmount: {
      fontSize: '42px',
      fontWeight: '700',
      position: 'relative',
      zIndex: 1
    },
    content: {
      padding: '32px'
    },
    orderInfo: {
      background: currentTheme.cardBg,
      backdropFilter: 'blur(10px)',
      borderRadius: '14px',
      padding: '18px',
      marginBottom: '28px',
      border: `1px solid ${currentTheme.cardBorder}`
    },
    orderLabel: {
      fontSize: '12px',
      color: currentTheme.textMuted,
      marginBottom: '6px',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    orderId: {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: currentTheme.textPrimary,
      wordBreak: 'break-all',
      background: currentTheme.inputBg,
      padding: '8px 12px',
      borderRadius: '8px',
      marginTop: '8px'
    },
    methodSelection: {
      display: 'flex',
      gap: '14px',
      marginBottom: '28px'
    },
    methodButton: {
      flex: 1,
      padding: '20px',
      border: `2px solid ${currentTheme.inputBorder}`,
      borderRadius: '16px',
      background: currentTheme.inputBg,
      backdropFilter: 'blur(5px)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'center'
    },
    methodButtonActive: {
      borderColor: currentTheme.accent,
      background: currentTheme.accentLight,
      boxShadow: `0 0 20px ${currentTheme.accent}30`
    },
    methodIcon: {
      fontSize: '32px',
      marginBottom: '10px'
    },
    methodLabel: {
      fontSize: '15px',
      fontWeight: '700',
      color: currentTheme.textPrimary
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '18px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    inputRow: {
      display: 'flex',
      gap: '14px'
    },
    label: {
      fontSize: '13px',
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
      outline: 'none',
      transition: 'all 0.3s ease',
      width: '100%',
      backdropFilter: 'blur(5px)'
    },
    payButton: {
      padding: '18px',
      background: currentTheme.accentGradient,
      color: 'white',
      border: 'none',
      borderRadius: '14px',
      fontSize: '17px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginTop: '10px',
      boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
    },
    processingState: {
      textAlign: 'center',
      padding: '50px 20px'
    },
    spinner: {
      width: '56px',
      height: '56px',
      border: `4px solid ${currentTheme.cardBorder}`,
      borderTop: `4px solid ${currentTheme.accent}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 24px'
    },
    processingText: {
      fontSize: '17px',
      color: currentTheme.textSecondary,
      fontWeight: '500'
    },
    successState: {
      textAlign: 'center',
      padding: '50px 20px'
    },
    successIcon: {
      width: '80px',
      height: '80px',
      background: currentTheme.successBg,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 24px',
      fontSize: '40px',
      border: `3px solid ${currentTheme.successText}40`
    },
    successTitle: {
      fontSize: '26px',
      fontWeight: '700',
      color: currentTheme.successText,
      marginBottom: '14px'
    },
    successPaymentId: {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: currentTheme.textMuted,
      marginBottom: '14px',
      background: currentTheme.inputBg,
      padding: '10px 16px',
      borderRadius: '10px',
      display: 'inline-block'
    },
    successMessage: {
      fontSize: '15px',
      color: currentTheme.textSecondary
    },
    errorState: {
      textAlign: 'center',
      padding: '50px 20px'
    },
    errorIcon: {
      width: '80px',
      height: '80px',
      background: currentTheme.errorBg,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 24px',
      fontSize: '40px',
      border: `3px solid ${currentTheme.errorText}40`
    },
    errorTitle: {
      fontSize: '26px',
      fontWeight: '700',
      color: currentTheme.errorText,
      marginBottom: '14px'
    },
    errorMessage: {
      fontSize: '15px',
      color: currentTheme.textSecondary,
      marginBottom: '24px'
    },
    retryButton: {
      padding: '14px 28px',
      background: currentTheme.errorBg,
      color: currentTheme.errorText,
      border: `2px solid ${currentTheme.errorText}40`,
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    loadingState: {
      textAlign: 'center',
      padding: '80px 20px',
      color: currentTheme.textMuted
    },
    errorCard: {
      background: currentTheme.errorBg,
      color: currentTheme.errorText,
      padding: '14px 18px',
      borderRadius: '12px',
      fontSize: '14px',
      marginBottom: '20px',
      border: `1px solid ${currentTheme.errorText}30`
    },
    noMethodText: {
      textAlign: 'center',
      color: currentTheme.textMuted,
      fontSize: '15px',
      padding: '20px'
    }
  };

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/v1/orders/${orderId}/public`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.description || 'Order not found');
        }

        if (data.status === 'paid') {
          setError('This order has already been paid');
          setLoading(false);
          return;
        }

        setOrder(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Poll payment status
  const pollPaymentStatus = useCallback(async (payId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/payments/${payId}/public`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.description || 'Failed to get payment status');
      }

      if (data.status === 'success') {
        setPaymentStatus('success');
        setProcessingPayment(false);
      } else if (data.status === 'failed') {
        setPaymentStatus('failed');
        setPaymentError(data.error_description || 'Payment failed');
        setProcessingPayment(false);
      } else {
        // Still processing, poll again
        setTimeout(() => pollPaymentStatus(payId), 2000);
      }
    } catch (err) {
      console.error('Poll error:', err);
      setTimeout(() => pollPaymentStatus(payId), 2000);
    }
  }, []);

  // Handle payment submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setProcessingPayment(true);
    setPaymentStatus('processing');

    try {
      const paymentData = {
        order_id: orderId,
        method: selectedMethod
      };

      if (selectedMethod === 'upi') {
        paymentData.vpa = vpa;
      } else if (selectedMethod === 'card') {
        paymentData.card = {
          number: cardNumber.replace(/\s/g, ''),
          expiry_month: expiryMonth,
          expiry_year: expiryYear,
          cvv: cvv,
          holder_name: cardholderName
        };
      }

      const response = await fetch(`${API_URL}/api/v1/payments/public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.description || 'Payment failed');
      }

      setPaymentId(data.id);
      
      // Start polling for status
      pollPaymentStatus(data.id);
    } catch (err) {
      setProcessingPayment(false);
      setPaymentStatus('failed');
      setPaymentError(err.message);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setPaymentStatus(null);
    setPaymentError('');
    setPaymentId(null);
    setProcessingPayment(false);
  };

  // Format amount
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount / 100);
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.bgOrb1}></div>
        <div style={styles.bgOrb2}></div>
        <button style={styles.themeToggle} onClick={toggleTheme}>
          {isDark ? '☀️' : '🌙'}
        </button>
        <div style={styles.card}>
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (no order)
  if (error && !order) {
    return (
      <div style={styles.container}>
        <div style={styles.bgOrb1}></div>
        <div style={styles.bgOrb2}></div>
        <button style={styles.themeToggle} onClick={toggleTheme}>
          {isDark ? '☀️' : '🌙'}
        </button>
        <div style={styles.card}>
          <div style={styles.errorState} data-test-id="error-state">
            <div style={styles.errorIcon}>❌</div>
            <h2 style={styles.errorTitle}>Error</h2>
            <span data-test-id="error-message" style={styles.errorMessage}>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.bgOrb1}></div>
      <div style={styles.bgOrb2}></div>
      
      <button style={styles.themeToggle} onClick={toggleTheme} title="Toggle theme">
        {isDark ? '☀️' : '🌙'}
      </button>

      <div data-test-id="checkout-container" style={styles.card}>
        {/* Header with amount */}
        <div style={styles.header}>
          <div style={styles.headerDecor}></div>
          <p style={styles.headerTitle}>Complete Payment</p>
          <p data-test-id="order-amount" style={styles.headerAmount}>
            {formatAmount(order?.amount || 0)}
          </p>
        </div>

        <div style={styles.content}>
          {/* Processing State */}
          {paymentStatus === 'processing' && (
            <div data-test-id="processing-state" style={styles.processingState}>
              <div style={styles.spinner}></div>
              <span data-test-id="processing-message" style={styles.processingText}>
                Processing payment...
              </span>
            </div>
          )}

          {/* Success State */}
          {paymentStatus === 'success' && (
            <div data-test-id="success-state" style={styles.successState}>
              <div style={styles.successIcon}>✓</div>
              <h2 style={styles.successTitle}>Payment Successful!</h2>
              <div style={styles.successPaymentId}>
                <span>Payment ID: </span>
                <span data-test-id="payment-id">{paymentId}</span>
              </div>
              <span data-test-id="success-message" style={styles.successMessage}>
                Your payment has been processed successfully
              </span>
            </div>
          )}

          {/* Error State */}
          {paymentStatus === 'failed' && (
            <div data-test-id="error-state" style={styles.errorState}>
              <div style={styles.errorIcon}>✕</div>
              <h2 style={styles.errorTitle}>Payment Failed</h2>
              <span data-test-id="error-message" style={styles.errorMessage}>
                {paymentError || 'Payment could not be processed'}
              </span>
              <button 
                data-test-id="retry-button" 
                style={styles.retryButton}
                onClick={handleRetry}
              >
                🔄 Try Again
              </button>
            </div>
          )}

          {/* Payment Form */}
          {!paymentStatus && (
            <>
              {/* Order Summary */}
              <div data-test-id="order-summary" style={styles.orderInfo}>
                <p style={styles.orderLabel}>Order ID</p>
                <p data-test-id="order-id" style={styles.orderId}>{order?.id}</p>
              </div>

              {/* Payment Method Selection */}
              <div data-test-id="payment-methods" style={styles.methodSelection}>
                <button
                  data-test-id="method-upi"
                  data-method="upi"
                  style={{
                    ...styles.methodButton,
                    ...(selectedMethod === 'upi' ? styles.methodButtonActive : {})
                  }}
                  onClick={() => setSelectedMethod('upi')}
                  type="button"
                >
                  <div style={styles.methodIcon}>📱</div>
                  <div style={styles.methodLabel}>UPI</div>
                </button>
                <button
                  data-test-id="method-card"
                  data-method="card"
                  style={{
                    ...styles.methodButton,
                    ...(selectedMethod === 'card' ? styles.methodButtonActive : {})
                  }}
                  onClick={() => setSelectedMethod('card')}
                  type="button"
                >
                  <div style={styles.methodIcon}>💳</div>
                  <div style={styles.methodLabel}>Card</div>
                </button>
              </div>

              {error && <div style={styles.errorCard}>{error}</div>}

              {/* UPI Form */}
              {selectedMethod === 'upi' && (
                <form data-test-id="upi-form" style={styles.form} onSubmit={handleSubmit}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>UPI ID</label>
                    <input
                      data-test-id="vpa-input"
                      type="text"
                      placeholder="username@bank"
                      value={vpa}
                      onChange={(e) => setVpa(e.target.value)}
                      style={styles.input}
                      required
                    />
                  </div>
                  <button 
                    data-test-id="pay-button" 
                    type="submit" 
                    style={styles.payButton}
                  >
                    💰 Pay {formatAmount(order?.amount || 0)}
                  </button>
                </form>
              )}

              {/* Card Form */}
              {selectedMethod === 'card' && (
                <form data-test-id="card-form" style={styles.form} onSubmit={handleSubmit}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Card Number</label>
                    <input
                      data-test-id="card-number-input"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      style={styles.input}
                      maxLength="19"
                      required
                    />
                  </div>
                  <div style={styles.inputRow}>
                    <div style={{ ...styles.inputGroup, flex: 1 }}>
                      <label style={styles.label}>Expiry Date</label>
                      <input
                        data-test-id="expiry-input"
                        type="text"
                        placeholder="MM/YY"
                        value={expiryMonth && expiryYear ? `${expiryMonth}/${expiryYear}` : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 2) {
                            setExpiryMonth(value);
                            setExpiryYear('');
                          } else {
                            setExpiryMonth(value.slice(0, 2));
                            setExpiryYear(value.slice(2, 4));
                          }
                        }}
                        style={styles.input}
                        maxLength="5"
                        required
                      />
                    </div>
                    <div style={{ ...styles.inputGroup, flex: 1 }}>
                      <label style={styles.label}>CVV</label>
                      <input
                        data-test-id="cvv-input"
                        type="password"
                        placeholder="•••"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        style={styles.input}
                        maxLength="4"
                        required
                      />
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Cardholder Name</label>
                    <input
                      data-test-id="cardholder-name-input"
                      type="text"
                      placeholder="Name on Card"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      style={styles.input}
                      required
                    />
                  </div>
                  <button 
                    data-test-id="pay-button" 
                    type="submit" 
                    style={styles.payButton}
                  >
                    💳 Pay {formatAmount(order?.amount || 0)}
                  </button>
                </form>
              )}

              {/* Initial state - no method selected */}
              {!selectedMethod && (
                <p style={styles.noMethodText}>
                  Select a payment method to continue
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Checkout;
