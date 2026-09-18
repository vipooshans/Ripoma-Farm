import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { User, MapPin, ClipboardList, Bell, Calendar, Receipt, LogOut, Flame, Award, Gift, Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import { HenIcon } from '../components/FarmIcons';
import { ValidatedInput, PasswordInputWithMeter } from '../components/FormFields';
import { FarmStoryModal } from '../components/FarmStoryModal';
import RipomaLogo from '../components/RipomaLogo';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const isGoogleClientConfigured =
  Boolean(GOOGLE_CLIENT_ID) &&
  !GOOGLE_CLIENT_ID.includes('your_google_client_id');

/** JWT uses base64url without padding; browser btoa padding breaks jwt.decode. */
const toBase64Url = (obj) =>
  btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const Profile = () => {
  const { user, login, register, logout, updateProfile, loginWithGoogle } = useContext(AuthContext);
  const { showToast } = useContext(NotificationContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const googleInitRef = useRef(false);

  // Redirect check
  const redirectTarget = searchParams.get('redirect') || '';

  // Warm Login Screen Transition Overlay
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Unlockable Farm Story Modal
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  // Signed out forms
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // Real-time Validation Spec
  const [authErrors, setAuthErrors] = useState({});
  const [authTouched, setAuthTouched] = useState({});
  
  // Login Lockout Cooldown variables
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);

  const validateAuthField = (name, value, isLogin = isLoginTab) => {
    let err = '';
    switch (name) {
      case 'name':
        if (!isLogin && !value.trim()) err = 'Full name is required';
        else if (!isLogin && (value.length < 2 || value.length > 60)) err = 'Name must be between 2 and 60 characters';
        break;
      case 'email':
        if (!value.trim()) err = 'Email address is required';
        else if (!/\S+@\S+\.\S+/.test(value)) err = 'Please enter a valid email address';
        else if (!isLogin && value.toLowerCase().trim() === 'customer@ripomafarm.com') {
          err = 'Looks like you already have an account — log in instead?';
        }
        break;
      case 'password':
        if (!value) err = 'Password is required';
        else if (value.length < 8) err = 'Password must be at least 8 characters';
        break;
      default:
        break;
    }
    return err;
  };

  // Signed in tabs
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotif, setLoadingNotif] = useState(false);

  // Edit forms
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [addressForm, setAddressForm] = useState({ street: '', city: '', state: '', zipCode: '', country: '' });

  // Invoice Modal
  const [activeInvoice, setActiveInvoice] = useState(null);

  const handleGoogleCredentialResponse = useCallback(async (response) => {
    setIsTransitioning(true);
    const res = await loginWithGoogle(response.credential);
    if (res.success) {
      setTimeout(() => {
        setIsTransitioning(false);
        showToast('Logged in with Google successfully!', 'success');
        if (redirectTarget) navigate(`/${redirectTarget}`);
      }, 700);
    } else {
      setIsTransitioning(false);
      showToast(res.message, 'error');
    }
  }, [loginWithGoogle, showToast, redirectTarget, navigate]);

  // Initialize Google Sign In (skip when client ID is a placeholder)
  useEffect(() => {
    if (user || !isLoginTab || !isGoogleClientConfigured) return;

    let cancelled = false;
    let retryTimer;

    const initializeGoogle = () => {
      if (cancelled || !window.google?.accounts?.id) {
        if (!cancelled) retryTimer = setTimeout(initializeGoogle, 500);
        return;
      }

      const btnContainer = document.getElementById('google-signin-button');
      if (!btnContainer) return;

      if (!googleInitRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        });
        googleInitRef.current = true;
      }

      btnContainer.innerHTML = '';
      // GSI requires a numeric pixel width (200–400), not CSS percentages
      const width = Math.min(400, Math.max(200, Math.floor(btnContainer.offsetWidth || 320)));
      window.google.accounts.id.renderButton(btnContainer, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width,
      });
    };

    initializeGoogle();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [user, isLoginTab, handleGoogleCredentialResponse]);

  const handleSimulateGoogleLogin = async () => {
    const mockToken = [
      toBase64Url({ alg: 'HS256', typ: 'JWT' }),
      toBase64Url({
        email: 'admin@ripomafarm.com',
        name: 'Google Admin Developer',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      }),
      'signature_placeholder',
    ].join('.');

    setIsTransitioning(true);
    setTimeout(async () => {
      const res = await loginWithGoogle(mockToken);
      if (res.success) {
        setTimeout(() => {
          setIsTransitioning(false);
          showToast('Logged in with Google Account (Admin Role)!', 'success');
          if (redirectTarget) navigate(`/${redirectTarget}`);
        }, 500);
      } else {
        setIsTransitioning(false);
        showToast(res.message, 'error');
      }
    }, 600);
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || ''
      });
      const savedAddress = user.address || user.addresses?.find((a) => a.isDefault) || user.addresses?.[0] || {};
      setAddressForm({
        street: savedAddress.street || '',
        city: savedAddress.city || '',
        state: savedAddress.state || '',
        zipCode: savedAddress.zipCode || '',
        country: savedAddress.country || 'USA'
      });
      fetchOrders();
      fetchNotifications();
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data } = await axios.get('/api/orders/myorders');
      setOrders(data);
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotif(true);
    try {
      const { data } = await axios.get('/api/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoadingNotif(false);
    }
  };

  const dismissNotification = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.filter(n => n._id !== id));
      showToast('Notification dismissed', 'info');
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  const handleInputChange = (name, value) => {
    setAuthForm(prev => ({ ...prev, [name]: value }));

    if (authTouched[name]) {
      const err = validateAuthField(name, value);
      setAuthErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleAuthBlur = (name, value) => {
    setAuthTouched(prev => ({ ...prev, [name]: true }));
    const err = validateAuthField(name, value);
    setAuthErrors(prev => ({ ...prev, [name]: err }));
  };

  const isFormValid = () => {
    const emailErr = validateAuthField('email', authForm.email);
    const pwdErr = validateAuthField('password', authForm.password);
    if (emailErr || pwdErr) return false;
    if (!isLoginTab) {
      const nameErr = validateAuthField('name', authForm.name);
      if (nameErr) return false;
    }
    return true;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    if (isLoginTab && lockoutTime && Date.now() < lockoutTime) {
      const remainingMin = Math.ceil((lockoutTime - Date.now()) / 60000);
      showToast(`Too many failed attempts. Try again in ${remainingMin} minutes.`, 'error');
      return;
    }

    const allErrors = {
      email: validateAuthField('email', authForm.email),
      password: validateAuthField('password', authForm.password)
    };
    if (!isLoginTab) {
      allErrors.name = validateAuthField('name', authForm.name);
    }

    setAuthErrors(allErrors);
    setAuthTouched({ name: true, email: true, password: true });

    if (Object.values(allErrors).some(err => err !== '')) {
      showToast('Please fix the highlighted form warnings.', 'error');
      return;
    }

    setIsTransitioning(true);
    let res;
    if (isLoginTab) {
      res = await login(authForm.email, authForm.password);
    } else {
      res = await register(authForm.name, authForm.email, authForm.password);
    }

    if (res.success) {
      setTimeout(() => {
        setIsTransitioning(false);
        showToast(isLoginTab ? 'Welcome back to Ripoma Farm!' : 'Account created! Welcome to Ripoma Farm.', 'success');
        setFailedAttempts(0);
        setLockoutTime(null);
        if (redirectTarget) navigate(`/${redirectTarget}`);
      }, 700);
    } else {
      setIsTransitioning(false);
      if (isLoginTab) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          const timeout = Date.now() + 15 * 60 * 1000;
          setLockoutTime(timeout);
          showToast('Too many failed attempts. Account locked for 15 minutes.', 'error');
        } else {
          showToast(`Invalid login credentials. Attempt ${nextAttempts} of 5.`, 'error');
        }
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const res = await updateProfile(profileForm.name, profileForm.phone, addressForm);
    if (res.success) {
      showToast('Profile updated successfully!', 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'Shipped': return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'Processing': return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'Cancelled': return 'bg-red-50 text-red-800 border-red-100';
      default: return 'bg-gray-50 text-gray-800 border-gray-100';
    }
  };

  /* ========================================================
     GUEST VIEW: SPLIT-SCREEN EDITORIAL AUTH EXPERIENCE
     ======================================================== */
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-[#F6EFE3] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        
        {/* Full-Screen Warm Login Transition Overlay */}
        {isTransitioning && (
          <div className="fixed inset-0 z-50 bg-[#F6EFE3] flex flex-col items-center justify-center animate-fade-in-up gap-4">
            <div className="animate-bounce">
              <RipomaLogo variant="icon" color="color" height={64} />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#2F4B3C]">Welcome to Ripoma Farm</h3>
            <p className="text-xs text-[#8A6A4B] uppercase tracking-widest font-semibold">Opening direct farm door...</p>
          </div>
        )}

        <div className="max-w-5xl mx-auto w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-[#8A6A4B]/15 grid grid-cols-1 md:grid-cols-12 min-h-[600px]">
          
          {/* LEFT COLUMN: Editorial Panning Photo & Brand Story */}
          <div className="md:col-span-6 relative overflow-hidden bg-[#2F4B3C] text-white flex flex-col justify-between p-8 sm:p-12">
            
            {/* Slowly Panning Background Image */}
            <div className="absolute inset-0 z-0 overflow-hidden opacity-40">
              <img
                src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80"
                alt="Southern Sri Lankan Farm Coast"
                className="w-full h-full object-cover animate-pan-bg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2F4B3C] via-[#2F4B3C]/60 to-transparent" />
            </div>

            {/* Top Brand Header */}
            <div className="relative z-10">
              <div className="mb-6">
                <RipomaLogo variant="full" color="white" height={42} />
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#F6EFE3]">
                <Sparkles className="w-3 h-3 text-[#C99A3A]" /> Direct Farm-to-Table Order System
              </span>
            </div>

            {/* Bottom Quote & Trust Badges */}
            <div className="relative z-10 mt-12 space-y-6">
              <blockquote className="font-serif italic text-lg text-[#F6EFE3]/95 leading-relaxed">
                "Our pasture eggs and organic coconuts are harvested daily at sunrise, packaged with care, and delivered fresh to your kitchen doorstep."
              </blockquote>

              <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-[#F6EFE3]/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C99A3A]" />
                  <span>100% Traceable Harvest</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#A65D3D]" />
                  <span>Earn Harvest Points</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive Coconut Cream Form */}
          <div className="md:col-span-6 bg-[#F6EFE3]/50 p-6 sm:p-10 flex flex-col justify-center">
            
            {/* Tab Switcher */}
            <div className="flex bg-white/80 p-1.5 rounded-xl border border-gray-200/80 mb-6 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setIsLoginTab(true);
                  setAuthErrors({});
                  setAuthTouched({});
                }}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  isLoginTab
                    ? 'bg-[#2F4B3C] text-white shadow-sm'
                    : 'text-gray-500 hover:text-[#2F4B3C]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoginTab(false);
                  setAuthErrors({});
                  setAuthTouched({});
                }}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  !isLoginTab
                    ? 'bg-[#2F4B3C] text-white shadow-sm'
                    : 'text-gray-500 hover:text-[#2F4B3C]'
                }`}
              >
                Register
              </button>
            </div>

            <div className="mb-6">
              <h3 className="font-serif text-2xl font-bold text-[#2F4B3C]">
                {isLoginTab ? 'Welcome Back' : 'Join Our Farm Family'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {isLoginTab
                  ? 'Sign in to access your direct address directory and track shipments.'
                  : 'Register now to earn Harvest Points and unlock exclusive farm stories.'}
              </p>
            </div>

            {/* Lockout Warning Banner */}
            {lockoutTime && Date.now() < lockoutTime && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2 animate-pulse">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>Account locked for failed attempts. Try again in {Math.ceil((lockoutTime - Date.now()) / 60000)} mins.</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} noValidate className="space-y-1">
              
              {!isLoginTab && (
                <ValidatedInput
                  id="name"
                  name="name"
                  type="text"
                  label="Full Name"
                  value={authForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={(e) => handleAuthBlur('name', e.target.value)}
                  error={authErrors.name}
                  touched={authTouched.name}
                  isValid={!authErrors.name}
                  placeholder="John Doe"
                  required
                />
              )}

              <ValidatedInput
                id="email"
                name="email"
                type="email"
                label="Email Address"
                value={authForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={(e) => handleAuthBlur('email', e.target.value)}
                error={authErrors.email}
                touched={authTouched.email}
                isValid={!authErrors.email}
                placeholder="customer@ripomafarm.com"
                required
                suggestionLink={
                  !isLoginTab && authErrors.email?.includes('already have an account')
                    ? {
                        text: 'Click here to Sign In instead →',
                        onClick: () => {
                          setIsLoginTab(true);
                          setAuthErrors({});
                          setAuthTouched({});
                        }
                      }
                    : null
                }
              />

              <PasswordInputWithMeter
                id="password"
                name="password"
                label="Password"
                value={authForm.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onBlur={(e) => handleAuthBlur('password', e.target.value)}
                error={authErrors.password}
                touched={authTouched.password}
                isValid={!authErrors.password}
                required
                showStrengthMeter={!isLoginTab}
              />

              {isLoginTab && (
                <div className="text-right mb-4">
                  <button
                    type="button"
                    onClick={() => showToast('Reset instructions sent to your mailbox.', 'info')}
                    className="text-xs font-medium text-gray-500 hover:text-[#2F4B3C] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid() || (lockoutTime && Date.now() < lockoutTime)}
                className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 shadow-md cursor-pointer ${
                  isFormValid() && (!lockoutTime || Date.now() >= lockoutTime)
                    ? 'bg-[#2F4B3C] hover:bg-[#A65D3D] text-white hover:shadow-lg active:scale-[0.99]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                }`}
              >
                {isLoginTab ? 'Sign In to Account' : 'Create Farm Account'}
              </button>

              {/* Social Login Options */}
              {isLoginTab && (
                <div className="mt-6 pt-5 border-t border-gray-200/80 space-y-3">
                  <div className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Quick Access
                  </div>
                  
                  {isGoogleClientConfigured ? (
                    <div id="google-signin-button" className="w-full flex justify-center" />
                  ) : (
                    <p className="text-center text-[10px] text-gray-400">
                      Set <code className="text-[#2F4B3C]">VITE_GOOGLE_CLIENT_ID</code> in{' '}
                      <code className="text-[#2F4B3C]">frontend/.env</code> to enable Google Sign-In.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleSimulateGoogleLogin}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-[#A65D3D] bg-[#A65D3D]/5 hover:bg-[#A65D3D]/10 text-[#8A6A4B] font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    🚀 Developer Google Admin Sourcing Bypass
                  </button>

                  <div className="text-center pt-2">
                    <span className="text-[10px] text-gray-400 block">Demo Customer Account:</span>
                    <span className="text-xs text-[#2F4B3C] font-semibold">customer@ripomafarm.com / customer123</span>
                  </div>
                </div>
              )}

            </form>

          </div>

        </div>

      </div>
    );
  }

  /* ========================================================
     CUSTOMER DASHBOARD: SIGNED IN VIEW
     ======================================================== */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans text-left bg-[#F6EFE3]">
      
      {/* Farm Story Modal */}
      <FarmStoryModal isOpen={isStoryModalOpen} onClose={() => setIsStoryModalOpen(false)} />

      {/* Header bar & Engagement Widgets */}
      <div className="bg-white border border-[#8A6A4B]/10 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6">
        
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 bg-[#2F4B3C]/10 rounded-2xl flex items-center justify-center font-serif font-bold text-[#2F4B3C] text-2xl border border-[#2F4B3C]/20 shadow-xs">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-serif font-bold text-[#2F4B3C] leading-snug">{user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#2F4B3C]/10 text-[#2F4B3C] text-[10px] font-bold uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Engagement Widgets: Points, Streak & Farm Stories */}
        <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
          
          {/* Freshness Streak Counter */}
          <div className="bg-[#F6EFE3] border border-[#8A6A4B]/20 px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#A65D3D]/10 text-[#A65D3D] flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Freshness Streak</span>
              <span className="text-xs font-bold text-[#2F4B3C]">6 Weeks Active 🔥</span>
            </div>
          </div>

          {/* Harvest Loyalty Points */}
          <div className="bg-[#2F4B3C]/5 border border-[#2F4B3C]/15 px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-[#2F4B3C] text-[#F6EFE3] flex items-center justify-center">
              <HenIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Harvest Points</span>
              <span className="text-xs font-bold text-[#2F4B3C]">185 Pts ($18.50 Off)</span>
            </div>
          </div>

          {/* Farm Story Unlock Button */}
          <button
            onClick={() => setIsStoryModalOpen(true)}
            className="bg-[#A65D3D] hover:bg-[#8A6A4B] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            <Award className="w-4 h-4" />
            <span>Farm Stories</span>
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-colors cursor-pointer shrink-0 border border-red-100"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Tabs */}
        <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex flex-col gap-1 lg:col-span-3">

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-3 rounded text-[10px] uppercase tracking-widest font-bold text-left transition-colors cursor-pointer ${
              activeTab === 'orders' ? 'bg-[#2F4B3C] text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Order History
          </button>
          
          <button
            onClick={() => setActiveTab('address')}
            className={`flex items-center gap-2 px-4 py-3 rounded text-[10px] uppercase tracking-widest font-bold text-left transition-colors cursor-pointer ${
              activeTab === 'address' ? 'bg-[#2F4B3C] text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <MapPin className="w-4 h-4" /> Address Registry
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-3 rounded text-[10px] uppercase tracking-widest font-bold text-left transition-colors cursor-pointer relative ${
              activeTab === 'notifications' ? 'bg-[#2F4B3C] text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Alert Logs</span>
            {notifications.length > 0 && (
              <span className="absolute right-4 bg-[#A65D3D] text-white font-bold text-[9px] px-2 py-0.5 rounded">
                {notifications.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Viewport */}
        <div className="lg:col-span-9">
          
          {/* TAB: Order History */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-gray-100 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-base font-serif text-[#2F4B3C] font-semibold flex items-center gap-2 border-b border-gray-50 pb-3">
                <ClipboardList className="w-4 h-4 text-[#A65D3D]" /> Order History
              </h3>

              {loadingOrders ? (
                <div className="space-y-4 animate-pulse">
                  {[1,2].map(n => <div key={n} className="h-16 bg-gray-50 rounded-lg"></div>)}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <span className="text-3xl block mb-2">🌾</span>
                  <p className="text-xs font-semibold font-sans">No Sourced Orders Registered</p>
                  <Link to="/catalog" className="text-[10px] text-[#2F4B3C] font-bold uppercase tracking-widest hover:text-[#A65D3D] block mt-2">Go Sourcing &rarr;</Link>
                </div>
              ) : (
                <div className="overflow-x-auto text-xs font-sans">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[9px] pb-3">
                        <th className="pb-3">Invoice Slip</th>
                        <th className="pb-3">Order Date</th>
                        <th className="pb-3">Total Cost</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 font-bold text-gray-900">{order.invoiceNumber}</td>
                          <td className="py-4 text-gray-500 font-light">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-4 font-bold text-[#2F4B3C]">${order.total.toFixed(2)}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 border rounded text-[8px] font-bold uppercase tracking-wider ${getStatusColor(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => setActiveInvoice(order)}
                              className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded border border-gray-200 transition-colors cursor-pointer text-[10px] uppercase tracking-wider"
                            >
                              Invoice
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: Address Details */}
          {activeTab === 'address' && (
            <div className="bg-white border border-gray-100 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-base font-serif text-[#2F4B3C] font-semibold flex items-center gap-2 border-b border-gray-50 pb-3">
                <MapPin className="w-4 h-4 text-[#A65D3D]" /> Address Sourcing Profile
              </h3>

              <form onSubmit={handleProfileUpdate} className="space-y-6 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Full Contact Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full border border-gray-200 focus:border-[#2F4B3C] focus:ring-1 focus:ring-[#2F4B3C] outline-none rounded py-2.5 px-3"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Mobile Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full border border-gray-200 focus:border-[#2F4B3C] focus:ring-1 focus:ring-[#2F4B3C] outline-none rounded py-2.5 px-3"
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t border-gray-50 pt-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Street Sourcing Address</label>
                    <input
                      type="text"
                      placeholder="Barn road, building number, street name"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      className="w-full border border-gray-200 focus:border-[#2F4B3C] focus:ring-1 focus:ring-[#2F4B3C] outline-none rounded py-2.5 px-3"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">City</label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full border border-gray-200 focus:border-[#2F4B3C] focus:ring-1 focus:ring-[#2F4B3C] outline-none rounded py-2.5 px-3"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">State</label>
                      <input
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="w-full border border-gray-200 focus:border-[#2F4B3C] focus:ring-1 focus:ring-[#2F4B3C] outline-none rounded py-2.5 px-3"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Zip Code</label>
                      <input
                        type="text"
                        value={addressForm.zipCode}
                        onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                        className="w-full border border-gray-200 focus:border-[#2F4B3C] focus:ring-1 focus:ring-[#2F4B3C] outline-none rounded py-2.5 px-3"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Country</label>
                      <input
                        type="text"
                        value={addressForm.country}
                        onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                        className="w-full border border-gray-200 focus:border-[#2F4B3C] focus:ring-1 focus:ring-[#2F4B3C] outline-none rounded py-2.5 px-3"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold py-2.5 px-6 rounded text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Save Address
                </button>
              </form>
            </div>
          )}

          {/* TAB: Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-gray-100 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="text-base font-serif text-[#2F4B3C] font-semibold flex items-center gap-2 border-b border-gray-50 pb-3">
                <Bell className="w-4 h-4 text-[#A65D3D]" /> Farm Notification Logs
              </h3>

              {loadingNotif ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-14 bg-gray-50 rounded-lg"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-xs">
                  <Bell className="w-8 h-8 mx-auto text-gray-300 mb-2 stroke-[1.5]" />
                  <p className="font-light">No notifications from the coops today.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className="border border-gray-100 rounded-xl p-4 flex justify-between items-start gap-4 hover:border-gray-200 transition-colors bg-[#F6EFE3]/30"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-gray-900 text-xs">{n.title}</h4>
                        <p className="text-[11px] text-gray-500 font-light leading-relaxed">{n.message}</p>
                        <span className="text-[9px] text-gray-400 font-light block pt-1">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => dismissNotification(n._id)}
                        className="text-[9px] font-bold text-gray-400 hover:text-gray-600 cursor-pointer shrink-0 uppercase tracking-wider"
                      >
                        Dismiss
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Printable Invoice Modal Details */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 sm:p-8 space-y-6 border border-gray-100 shadow-2xl relative animate-fade-in-up font-sans text-xs">
            
            {/* Modal header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-1.5">
                <Receipt className="w-4.5 h-4.5 text-[#2F4B3C]" />
                <h3 className="font-serif text-base font-bold text-[#2F4B3C]">Invoice details</h3>
              </div>
              <button
                onClick={() => setActiveInvoice(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content sheet */}
            <div className="space-y-6 text-gray-600">
              
              {/* Brand info */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm font-serif font-bold text-[#2F4B3C] block tracking-wide">Ripoma Farm & Foods</span>
                  <span className="text-[10px] text-gray-400 font-light">10 Organic Way, Agro Valley</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-gray-800 block">{activeInvoice.invoiceNumber}</span>
                  <span className="text-[10px] text-gray-400">Date: {new Date(activeInvoice.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Delivery / Sourcing Info */}
              <div className="grid grid-cols-2 gap-4 border-y border-gray-50 py-4">
                <div>
                  <span className="font-bold text-[9px] text-gray-400 uppercase tracking-wider block mb-1">Delivered To</span>
                  <span className="font-bold text-gray-950 block">{activeInvoice.customerDetails.name}</span>
                  <span className="font-light">{activeInvoice.customerDetails.street}</span>
                  <span className="font-light block">{activeInvoice.customerDetails.city}, {activeInvoice.customerDetails.state} {activeInvoice.customerDetails.zipCode}</span>
                </div>
                <div>
                  <span className="font-bold text-[9px] text-gray-400 uppercase tracking-wider block mb-1">Payment Surcharges</span>
                  <span className="font-bold text-gray-950 block">{activeInvoice.paymentMethod}</span>
                  <span className="text-[9px] bg-emerald-50 text-emerald-800 px-2 py-0.5 border border-emerald-100 rounded font-bold uppercase inline-block mt-1 tracking-wider">
                    {activeInvoice.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Items details */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 font-bold text-gray-400 border-b border-gray-50 pb-2 uppercase text-[8px] tracking-wider">
                  <span className="col-span-6">Harvest Item Description</span>
                  <span className="col-span-2 text-center">Unit Price</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Subtotal</span>
                </div>
                
                {activeInvoice.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-1 text-gray-800 items-center">
                    <div className="col-span-6 min-w-0">
                      <span className="font-semibold block truncate text-[11px]">{item.name}</span>
                      {item.variantName && <span className="text-[9px] text-gray-400 font-light block">{item.variantName}</span>}
                    </div>
                    <span className="col-span-2 text-center font-light">${item.price.toFixed(2)}</span>
                    <span className="col-span-2 text-center font-light">{item.quantity}</span>
                    <span className="col-span-2 text-right font-bold text-[#2F4B3C]">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Calculations breakdown */}
              <div className="border-t border-gray-100 pt-4 flex flex-col items-end gap-1 text-right">
                <div className="w-40 flex justify-between text-[11px]">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-800">${activeInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="w-40 flex justify-between text-[11px]">
                  <span>Tax & Curing:</span>
                  <span className="font-semibold text-gray-800">${activeInvoice.tax.toFixed(2)}</span>
                </div>
                <div className="w-40 flex justify-between text-[11px]">
                  <span>Delivery:</span>
                  <span className="font-semibold text-gray-800">${activeInvoice.shippingFee.toFixed(2)}</span>
                </div>
                <div className="w-40 flex justify-between font-bold text-gray-950 border-t border-gray-100 pt-1.5 mt-1 text-xs">
                  <span>Total Amount:</span>
                  <span className="text-[#2F4B3C] font-bold">${activeInvoice.total.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Modal actions */}
            <div className="text-right pt-2 border-t border-gray-50">
              <button
                onClick={() => window.print()}
                className="bg-[#2F4B3C] hover:bg-[#A65D3D] text-white font-bold text-[10px] uppercase tracking-widest px-5 py-2.5 rounded transition-colors cursor-pointer"
              >
                Print Invoice Receipt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
