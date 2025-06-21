// app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import { sendOtp, verifyOtp } from '../../../firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminLogin() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [step, setStep] = useState(1); // Step 1: Enter phone number, Step 2: Enter OTP

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const confirmation = await sendOtp(phoneNumber);
      setConfirmationResult(confirmation);
      setStep(2);
    } catch (error) {
      console.error("Error sending OTP: ", error);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await verifyOtp(confirmationResult, otp);
      alert('Login successful');
      console.log(user);  // User is now logged in
    } catch (error) {
      console.error("Error verifying OTP: ", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Login</h1>

      {step === 1 && (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
          <Button type="submit">Send OTP</Button>
          <div id="recaptcha-container"></div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <Button type="submit">Verify OTP</Button>
        </form>
      )}
    </div>
  );
}
