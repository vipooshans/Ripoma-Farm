import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Check, AlertCircle, Plus, Minus, CreditCard, ShieldCheck } from 'lucide-react';
import { formatSriLankanPhoneInput, PHONE_PLACEHOLDER } from '../utils/phone';

/**
 * ValidatedInput
 * Floating label, soft focus ring glow, underline draw animation,
 * inline blur validation checkmark/warning icon, and slide-down error message.
 */
export const ValidatedInput = ({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  isValid,
  placeholder = '',
  required = false,
  autoComplete,
  className = '',
  suggestionLink = null, // e.g. { text: string, onClick: func }
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isFloating = isFocused || (value && value.toString().length > 0);

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className={`relative mb-5 text-left ${className}`}>
      <div className="relative flex items-center">
        <input
          id={id || name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused ? placeholder : ''}
          required={required}
          autoComplete={autoComplete}
          className={`w-full px-4 pt-5 pb-2 text-sm bg-white/75 rounded-lg border transition-all duration-200 outline-none text-[#2F4B3C] font-medium shadow-sm ${
            touched && error
              ? 'border-[#A65D3D] focus:ring-2 focus:ring-[#A65D3D]/20'
              : touched && isValid
              ? 'border-[#2F4B3C] focus:ring-2 focus:ring-[#2F4B3C]/20'
              : 'border-gray-200 focus:border-[#2F4B3C] focus:ring-2 focus:ring-[#2F4B3C]/15'
          }`}
          {...props}
        />

        {/* Floating Label */}
        <label
          htmlFor={id || name}
          className={`absolute left-4 transition-all duration-200 pointer-events-none ${
            isFloating
              ? 'top-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2F4B3C]/70'
              : 'top-3.5 text-xs font-medium text-gray-400'
          }`}
        >
          {label} {required && <span className="text-[#A65D3D]">*</span>}
        </label>

        {/* Inline Status Icons */}
        <div className="absolute right-3.5 flex items-center gap-1.5 pointer-events-none">
          {touched && isValid && !error && (
            <div className="w-5 h-5 rounded-full bg-[#2F4B3C]/10 text-[#2F4B3C] flex items-center justify-center animate-pop-scale">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
          {touched && error && (
            <div className="w-5 h-5 rounded-full bg-[#A65D3D]/10 text-[#A65D3D] flex items-center justify-center animate-pop-scale">
              <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          )}
        </div>
      </div>

      {/* Animated Underline Transition */}
      <div
        className={`h-0.5 w-full bg-[#2F4B3C] transition-all duration-300 transform scale-x-0 ${
          isFocused ? 'scale-x-100' : ''
        }`}
      />

      {/* Error Slide-Down Message & Suggestion Link */}
      {touched && error && (
        <div className="mt-1.5 px-1 flex flex-col gap-0.5 animate-slide-down-fade">
          <p className="text-xs text-[#A65D3D] font-medium flex items-center gap-1">
            <span>{error}</span>
          </p>
          {suggestionLink && (
            <button
              type="button"
              onClick={suggestionLink.onClick}
              className="text-left text-xs font-semibold text-[#2F4B3C] underline hover:text-[#A65D3D] transition-colors cursor-pointer mt-0.5"
            >
              {suggestionLink.text}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * PasswordInputWithMeter
 * Password input with floating label, eye toggle morph, and 3-color strength meter.
 */
export const PasswordInputWithMeter = ({
  id,
  name = 'password',
  label = 'Password',
  value,
  onChange,
  onBlur,
  error,
  touched,
  isValid,
  required = false,
  showStrengthMeter = true
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isFloating = isFocused || (value && value.length > 0);

  // Strength calculation: 0 = empty, 1 = weak, 2 = medium, 3 = strong
  const getStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-gray-200' };
    if (pwd.length < 8) return { score: 1, label: 'Weak (min 8 chars)', color: 'bg-[#A65D3D]' };
    
    let score = 1;
    const hasNum = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const hasLetter = /[A-Za-z]/.test(pwd);

    if (hasLetter && hasNum) score = 2;
    if (hasLetter && hasNum && hasSpecial) score = 3;

    if (score === 3) return { score: 3, label: 'Strong password', color: 'bg-[#2F4B3C]' };
    if (score === 2) return { score: 2, label: 'Good strength', color: 'bg-[#C99A3A]' };
    return { score: 1, label: 'Add numbers & symbols', color: 'bg-[#A65D3D]' };
  };

  const strength = getStrength(value);

  return (
    <div className="relative mb-5 text-left">
      <div className="relative flex items-center">
        <input
          id={id || name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          required={required}
          className={`w-full px-4 pt-5 pb-2 pr-12 text-sm bg-white/75 rounded-lg border transition-all duration-200 outline-none text-[#2F4B3C] font-medium shadow-sm ${
            touched && error
              ? 'border-[#A65D3D] focus:ring-2 focus:ring-[#A65D3D]/20'
              : touched && isValid
              ? 'border-[#2F4B3C] focus:ring-2 focus:ring-[#2F4B3C]/20'
              : 'border-gray-200 focus:border-[#2F4B3C] focus:ring-2 focus:ring-[#2F4B3C]/15'
          }`}
        />

        <label
          htmlFor={id || name}
          className={`absolute left-4 transition-all duration-200 pointer-events-none ${
            isFloating
              ? 'top-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2F4B3C]/70'
              : 'top-3.5 text-xs font-medium text-gray-400'
          }`}
        >
          {label} {required && <span className="text-[#A65D3D]">*</span>}
        </label>

        {/* Eye Morph Toggle Icon */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 p-1 text-gray-400 hover:text-[#2F4B3C] transition-colors cursor-pointer"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 transition-transform duration-200 hover:scale-110" />
          ) : (
            <Eye className="w-4 h-4 transition-transform duration-200 hover:scale-110" />
          )}
        </button>
      </div>

      {/* Strength Meter Bar */}
      {showStrengthMeter && value && (
        <div className="mt-2 animate-slide-down-fade">
          <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
            <span className="text-gray-500 uppercase tracking-wider text-[9px]">Password Strength</span>
            <span
              className={`text-[10px] font-bold ${
                strength.score === 3
                  ? 'text-[#2F4B3C]'
                  : strength.score === 2
                  ? 'text-[#C99A3A]'
                  : 'text-[#A65D3D]'
              }`}
            >
              {strength.label}
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden flex gap-1">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                strength.score >= 1 ? strength.color : 'bg-transparent'
              } w-1/3`}
            />
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                strength.score >= 2 ? strength.color : 'bg-transparent'
              } w-1/3`}
            />
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                strength.score >= 3 ? strength.color : 'bg-transparent'
              } w-1/3`}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {touched && error && (
        <p className="mt-1.5 px-1 text-xs text-[#A65D3D] font-medium animate-slide-down-fade">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * PhoneInput
 * Real-time phone number auto-formatter.
 */
export const PhoneInput = ({ value, onChange, onBlur, error, touched, isValid, label = 'Phone Number', required = false }) => {
  const handleChange = (e) => {
    onChange({ target: { name: 'phone', value: formatSriLankanPhoneInput(e.target.value) } });
  };

  return (
    <ValidatedInput
      id="phone"
      name="phone"
      type="tel"
      label={label}
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      error={error}
      touched={touched}
      isValid={isValid}
      required={required}
      placeholder={PHONE_PLACEHOLDER}
    />
  );
};

/**
 * TwoFactorCodeInput
 * 6-digit boxed 2FA entry with auto-advancing focus & auto-submit on 6th digit.
 */
export const TwoFactorCodeInput = ({ onComplete, length = 6, error }) => {
  const [code, setCode] = useState(Array(length).fill(''));
  const inputsRef = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (!/^[0-9]?$/.test(val)) return;

    const newCode = [...code];
    newCode[index] = val;
    setCode(newCode);

    // Auto-advance
    if (val && index < length - 1) {
      inputsRef.current[index + 1].focus();
    }

    // Trigger complete
    if (newCode.every((digit) => digit !== '') && onComplete) {
      onComplete(newCode.join(''));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    
    const newCode = Array(length).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    if (pasted.length === length && onComplete) {
      onComplete(pasted);
    } else {
      const nextFocus = Math.min(pasted.length, length - 1);
      inputsRef.current[nextFocus]?.focus();
    }
  };

  return (
    <div className="my-6">
      <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {code.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (inputsRef.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`w-11 h-13 text-center text-xl font-bold font-mono rounded-lg border transition-all duration-200 outline-none ${
              digit
                ? 'border-[#2F4B3C] bg-[#2F4B3C]/10 text-[#2F4B3C] ring-2 ring-[#2F4B3C]/20 shadow-sm'
                : 'border-gray-300 bg-white text-gray-800 focus:border-[#2F4B3C] focus:ring-2 focus:ring-[#2F4B3C]/20'
            }`}
          />
        ))}
      </div>
      {error && (
        <p className="mt-3 text-center text-xs text-[#A65D3D] font-semibold animate-slide-down-fade">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * CreditCardInput
 * Card number with live auto-detecting brand logo (Visa, Mastercard, Amex).
 */
export const CreditCardInput = ({ value, onChange, onBlur, error, touched, isValid }) => {
  const getCardType = (cardNumber) => {
    const num = cardNumber.replace(/\D/g, '');
    if (/^4/.test(num)) return 'VISA';
    if (/^5[1-5]/.test(num)) return 'MC';
    if (/^3[47]/.test(num)) return 'AMEX';
    return 'UNKNOWN';
  };

  const cardType = getCardType(value || '');

  const handleChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    let formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    onChange({ target: { name: 'cardNumber', value: formatted } });
  };

  return (
    <div className="relative mb-4">
      <ValidatedInput
        id="cardNumber"
        name="cardNumber"
        type="text"
        label="Card Number"
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        error={error}
        touched={touched}
        isValid={isValid}
        placeholder="4532 0123 4567 8910"
        required
      />

      {/* Card Brand Badge Indicator */}
      <div className="absolute right-3 top-3.5 pointer-events-none transition-opacity duration-200">
        {cardType === 'VISA' && (
          <span className="px-2 py-0.5 text-[10px] font-black tracking-wider text-blue-700 bg-blue-50 border border-blue-200 rounded animate-pop-scale">
            VISA
          </span>
        )}
        {cardType === 'MC' && (
          <span className="px-2 py-0.5 text-[10px] font-black tracking-wider text-orange-700 bg-orange-50 border border-orange-200 rounded animate-pop-scale">
            MC
          </span>
        )}
        {cardType === 'AMEX' && (
          <span className="px-2 py-0.5 text-[10px] font-black tracking-wider text-cyan-800 bg-cyan-50 border border-cyan-200 rounded animate-pop-scale">
            AMEX
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * QuantityStepper
 * Interactive +/- stepper buttons with satisfying micro-bounce tick.
 */
export const QuantityStepper = ({ value, min = 0, max = 999, onChange, label }) => {
  const [bounce, setBounce] = useState(false);

  const triggerBounce = () => {
    setBounce(true);
    setTimeout(() => setBounce(false), 200);
  };

  const handleDecrement = () => {
    if (value > min) {
      triggerBounce();
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      triggerBounce();
      onChange(value + 1);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-xs font-semibold text-gray-700">{label}</span>}
      <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white shadow-sm p-1">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-[#F6EFE3] hover:text-[#2F4B3C] disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span
          className={`w-10 text-center font-bold text-sm text-[#2F4B3C] transition-transform duration-150 ${
            bounce ? 'scale-125 text-[#A65D3D]' : 'scale-100'
          }`}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:bg-[#F6EFE3] hover:text-[#2F4B3C] disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
