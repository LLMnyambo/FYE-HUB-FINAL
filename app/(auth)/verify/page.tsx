'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleResend = async () => {
    if (!email) return
    
    setResendStatus('sending')
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      if (response.ok) {
        setResendStatus('sent')
      } else {
        setResendStatus('error')
      }
    } catch {
      setResendStatus('error')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 text-center shadow-lg">
        <h1 className="text-3xl font-bold text-primary">Check Your Email</h1>
        <p className="text-muted-foreground">
          We've sent a verification link to your UMP email.
          Please check your inbox and click the link to activate your account.
        </p>
        
        {email && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
            📧 Sent to: <strong>{email}</strong>
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={handleResend}
            disabled={resendStatus === 'sending'}
            className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {resendStatus === 'sending' && 'Sending...'}
            {resendStatus === 'sent' && '✅ Resent Successfully!'}
            {resendStatus === 'error' && '❌ Error - Try Again'}
            {(resendStatus === 'idle' || resendStatus === 'error') && 'Resend Verification Email'}
          </button>
          
          <div>
            <a href="/login" className="text-sm text-primary hover:underline">
              ← Back to Login
            </a>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>Didn't receive the email?</p>
          <ul className="mt-2 list-disc text-left pl-5">
            <li>Check your spam folder</li>
            <li>Wait a few minutes</li>
            <li>Click the resend button above</li>
          </ul>
        </div>
      </div>
    </div>
  )
}