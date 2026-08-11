import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { UserProfile } from '../api';
import { api } from '../api';
import { Logo } from './Logo';
import { Globe, ShieldAlert, AlertCircle } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const LoginModal: React.FC = () => {
  const {
    authStep,
    setAuthStep,
    loginEmail,
    setLoginEmail,
    handleLoginSuccess,
  } = useApp();

  // Login States
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Validation States
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [registerEmailError, setRegisterEmailError] = useState<string | null>(null);
  const [signupPasswordError, setSignupPasswordError] = useState<string | null>(null);

  // Signup States
  const [signupForm, setSignupForm] = useState<Partial<UserProfile> & { password?: string }>({
    email: '',
    password: '',
    firstName: 'Graham',
    middleName: '',
    lastName: 'Nickbel',
    gender: 'prefer-not-to-say',
    dob: '',
    language: 'English',
    preference: 'dark',
    userType: 'user'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGoogleClick = () => {
    showToast('Google Sign-In is coming soon!');
  };

  // Step 1: Submit Email + Password
  const handleRequestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let hasError = false;
    if (!loginEmail || !loginEmail.trim()) {
      setEmailError('Please enter your email address.');
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError('Please enter your password.');
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (hasError) return;

    setError(null);
    setLoading(true);

    try {
      await api.requestLogin(loginEmail, password);
      // Wait, let's keep password or save it in case we need it
      setAuthStep('otp');
    } catch (err: any) {
      setError(err.message || 'Login request failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit OTP
  const handleConfirmLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setError(null);
    setLoading(true);

    try {
      // Prefilled logs to match user's spec details
      const deviceType = 'Windows Browser';
      const ipAddress = '100.123.126.113';
      const loginLocation = 'Kolkata, India';

      const data = await api.confirmLogin(otp, deviceType, ipAddress, loginLocation);
      if (data) {
        try {
          const profileRes = await api.getProfile();
          if (profileRes && profileRes.user) {
            handleLoginSuccess(profileRes.user);
            return;
          }
        } catch (profileErr) {
          console.warn('Profile fetch failed, trying fallback:', profileErr);
        }

        const userObj = data.user || (data as any).userModel || data;
        handleLoginSuccess(userObj);
      }
    } catch (err: any) {
      setError(err.message || 'OTP confirmation failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextRegisterStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.email || !signupForm.email.trim()) {
      setRegisterEmailError('Please enter your email address.');
      return;
    }
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupForm.email)) {
      setRegisterEmailError('Please enter a valid email address.');
      return;
    }
    setRegisterEmailError(null);
    setAuthStep('register-details');
  };

  // Sign up request
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.password) {
      setSignupPasswordError('Please create a password.');
      return;
    }
    setSignupPasswordError(null);
    setError(null);
    setLoading(true);

    try {
      // Admin header configuration in API if userType is admin
      const isAdmin = signupForm.userType === 'admin';
      await api.signup(signupForm, isAdmin);
      setAuthStep('pending-approval');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email might already exist.');
    } finally {
      setLoading(false);
    }
  };

  const updateSignupField = (field: keyof typeof signupForm, value: any) => {
    setSignupForm(prev => ({ ...prev, [field]: value }));
  };

  // Visual Form Wrappers
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-base)',
      color: 'var(--text-main)',
      fontFamily: 'var(--font-family)',
      padding: '40px 20px',
      overflowY: 'auto',
      position: 'relative',
      transition: 'background-color var(--transition-speed) var(--transition-ease), color var(--transition-speed) var(--transition-ease)'
    }}>
      {/* Floating Theme Toggle */}
      <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 1000 }}>
        <ThemeToggle />
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          backgroundColor: 'var(--accent-green)',
          color: '#000000',
          padding: '12px 24px',
          borderRadius: '30px',
          fontWeight: 700,
          boxShadow: '0 4px 12px var(--shadow-color)',
          zIndex: 9999
        }}>
          {toastMessage}
        </div>
      )}

      {/* Main container (card-less, blends into full screen background like Spotify) */}
      <div style={{
        width: '100%',
        maxWidth: authStep === 'register-details' ? '700px' : '450px',
        padding: '40px 24px',
        textAlign: 'center',
        margin: 'auto 0',
        transition: 'all var(--transition-speed) var(--transition-ease)'
      }}>
        {/* Headphone Logo */}
        <Logo size={48} className="mb-4" />

        {error && (
          <div style={{
            backgroundColor: 'rgba(233, 20, 41, 0.15)',
            border: '1px solid #e91429',
            color: '#ff4d5a',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '0.85rem',
            textAlign: 'left',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Phase 1: Request Login */}
        {authStep === 'login' && (
          <div>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '24px 0 40px', letterSpacing: '-1.5px', lineHeight: 1.15 }}>
              Welcome back
            </h1>

            <form onSubmit={handleRequestLogin} noValidate>
              <div>
                <label className="spotify-label">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  required
                  className={`spotify-input ${emailError ? 'has-error' : ''}`}
                  disabled={loading}
                />
                {emailError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#e91429',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    marginTop: '-12px',
                    marginBottom: '16px',
                    textAlign: 'left'
                  }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="spotify-label">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  required
                  className={`spotify-input ${passwordError ? 'has-error' : ''}`}
                  disabled={loading}
                />
                {passwordError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#e91429',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    marginTop: '-12px',
                    marginBottom: '16px',
                    textAlign: 'left'
                  }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '30px',
                  fontSize: '1rem',
                  marginTop: '8px',
                  boxShadow: 'none',
                  textTransform: 'none'
                }}
              >
                {loading ? 'Continuing...' : 'Continue'}
              </button>
            </form>

            <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
              <span style={{ padding: '0 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            </div>

            {/* Google Pill Button */}
            <button
              onClick={handleGoogleClick}
              style={{
                width: '100%',
                padding: '12px 24px',
                borderRadius: '30px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '32px'
              }}
            >
              {/* Custom Google G Icon svg */}
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <button
                onClick={() => { setError(null); setAuthStep('register'); }}
                style={{ color: 'var(--text-main)', textDecoration: 'underline', fontWeight: 700 }}
              >
                Sign up for Hotify
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Enter OTP */}
        {authStep === 'otp' && (
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '24px 0 20px', letterSpacing: '-1.5px', lineHeight: 1.15 }}>
              Verify it's you
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              We sent a 6-digit confirmation OTP code to <strong style={{ color: 'var(--text-main)' }}>{loginEmail}</strong>. Please enter the code below to complete sign-in.
            </p>

            <form onSubmit={handleConfirmLogin}>
              <div>
                <label className="spotify-label">6-Digit OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  className="spotify-input"
                  style={{
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    letterSpacing: '10px',
                    fontWeight: 700,
                    padding: '12px'
                  }}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '30px',
                  fontSize: '1rem',
                  marginTop: '8px',
                  boxShadow: 'none',
                  textTransform: 'none'
                }}
              >
                {loading ? 'Confirming...' : 'Confirm Sign-In'}
              </button>
            </form>

            <div style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Didn't receive code?{' '}
              <button
                onClick={handleRequestLogin}
                style={{ color: 'var(--accent-green)', fontWeight: 700, background: 'none', border: 'none' }}
              >
                Resend OTP
              </button>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '24px', paddingTop: '20px', fontSize: '0.85rem' }}>
              <button
                onClick={() => { setError(null); setAuthStep('login'); }}
                style={{ color: 'var(--text-main)', textDecoration: 'underline' }}
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        {/* Phase 3: Initial Signup / Register (Email only, like Spotify) */}
        {authStep === 'register' && (
          <div>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, margin: '24px 0 40px', letterSpacing: '-1.5px', lineHeight: 1.15 }}>
              Sign up to start listening
            </h1>

            <form onSubmit={handleNextRegisterStep} noValidate>
              <div>
                <label className="spotify-label">Email address</label>
                <input
                  type="email"
                  value={signupForm.email || ''}
                  onChange={(e) => {
                    updateSignupField('email', e.target.value);
                    if (registerEmailError) setRegisterEmailError(null);
                  }}
                  required
                  className={`spotify-input ${registerEmailError ? 'has-error' : ''}`}
                  disabled={loading}
                />
                {registerEmailError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#e91429',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    marginTop: '-12px',
                    marginBottom: '16px',
                    textAlign: 'left'
                  }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{registerEmailError}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '30px',
                  fontSize: '1rem',
                  marginTop: '12px',
                  boxShadow: 'none',
                  textTransform: 'none',
                  fontWeight: 700
                }}
              >
                Next
              </button>
            </form>

            <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
              <span style={{ padding: '0 16px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            </div>

            {/* Google Pill Button */}
            <button
              onClick={handleGoogleClick}
              style={{
                width: '100%',
                padding: '12px 24px',
                borderRadius: '30px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <button
                onClick={() => { setError(null); setAuthStep('login'); }}
                style={{ color: 'var(--text-main)', textDecoration: 'underline', fontWeight: 700 }}
              >
                Log in here
              </button>
            </div>
          </div>
        )}

        {/* Phase 3b: Signup Details (Full layout width, spacious, premium) */}
        {authStep === 'register-details' && (
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '24px 0 24px', letterSpacing: '-1.5px', lineHeight: 1.15 }}>
              Tell us about yourself
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Signing up with <strong style={{ color: 'var(--text-main)' }}>{signupForm.email}</strong>.
            </p>

            <form onSubmit={handleSignup} noValidate style={{ textAlign: 'left' }}>
              {/* Password Row */}
              <div style={{ marginBottom: '16px' }}>
                <label className="spotify-label">Password *</label>
                <input
                  type="password"
                  value={signupForm.password || ''}
                  onChange={(e) => {
                    updateSignupField('password', e.target.value);
                    if (signupPasswordError) setSignupPasswordError(null);
                  }}
                  required
                  className={`spotify-input ${signupPasswordError ? 'has-error' : ''}`}
                  disabled={loading}
                />
                {signupPasswordError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#e91429',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    marginTop: '-12px',
                    marginBottom: '16px',
                    textAlign: 'left'
                  }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{signupPasswordError}</span>
                  </div>
                )}
              </div>

              {/* Names Grid: First, Middle, Last */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '8px' }}>
                <div>
                  <label className="spotify-label">First Name</label>
                  <input
                    type="text"
                    value={signupForm.firstName || ''}
                    onChange={(e) => updateSignupField('firstName', e.target.value)}
                    className="spotify-input"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="spotify-label">Middle Name</label>
                  <input
                    type="text"
                    value={signupForm.middleName || ''}
                    onChange={(e) => updateSignupField('middleName', e.target.value)}
                    className="spotify-input"
                    placeholder="Optional"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="spotify-label">Last Name</label>
                  <input
                    type="text"
                    value={signupForm.lastName || ''}
                    onChange={(e) => updateSignupField('lastName', e.target.value)}
                    className="spotify-input"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Gender and DOB Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '8px' }}>
                <div>
                  <label className="spotify-label">Gender</label>
                  <select
                    value={signupForm.gender || 'prefer-not-to-say'}
                    onChange={(e) => updateSignupField('gender', e.target.value)}
                    className="spotify-input"
                    style={{ padding: '12px 10px' }}
                    disabled={loading}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="spotify-label">Date of Birth</label>
                  <input
                    type="date"
                    value={signupForm.dob || ''}
                    onChange={(e) => updateSignupField('dob', e.target.value)}
                    className="spotify-input"
                    style={{ padding: '10px' }}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Language and Preference Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '8px' }}>
                <div>
                  <label className="spotify-label">Language</label>
                  <input
                    type="text"
                    value={signupForm.language || 'English'}
                    onChange={(e) => updateSignupField('language', e.target.value)}
                    className="spotify-input"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="spotify-label">Preference</label>
                  <select
                    value={signupForm.preference || 'dark'}
                    onChange={(e) => updateSignupField('preference', e.target.value)}
                    className="spotify-input"
                    style={{ padding: '12px 10px' }}
                    disabled={loading}
                  >
                    <option value="dark">Dark Theme</option>
                    <option value="bright">Bright Theme</option>
                  </select>
                </div>
              </div>

              {/* Register as Role */}
              <div style={{ marginBottom: '24px' }}>
                <label className="spotify-label">Register as Role</label>
                <select
                  value={signupForm.userType || 'user'}
                  onChange={(e) => updateSignupField('userType', e.target.value)}
                  className="spotify-input"
                  style={{ padding: '12px 10px' }}
                  disabled={loading}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setAuthStep('register')}
                  className="spotify-input"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontWeight: 700,
                    margin: 0,
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    flex: 2,
                    padding: '14px',
                    borderRadius: '30px',
                    fontSize: '1rem',
                    boxShadow: 'none',
                    textTransform: 'none',
                    fontWeight: 700
                  }}
                >
                  {loading ? 'Registering...' : 'Sign up'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Phase 4: Pending Admin Approval */}
        {authStep === 'pending-approval' && (
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '24px 0 20px', letterSpacing: '-1px', color: 'var(--accent-green)', lineHeight: 1.15 }}>
              Registration Successful!
            </h1>
            
            <div style={{
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '24px',
              textAlign: 'left',
              marginBottom: '24px',
              lineHeight: '1.6',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)'
            }}>
              <Globe size={32} style={{ color: 'var(--accent-green)', marginBottom: '12px' }} />
              <p style={{ marginBottom: '12px', color: 'var(--text-main)', fontWeight: 600 }}>Pending Admin Approval</p>
              Your account has been submitted successfully. In order to access Hotify, your registration must be approved by an administrator.
              <br/><br/>
              An email notification will be dispatched once your account status changes.
            </div>

            <button
              onClick={() => { setError(null); setAuthStep('login'); }}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '30px',
                fontSize: '1rem',
                boxShadow: 'none',
                textTransform: 'none'
              }}
            >
              Go to Login Screen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
