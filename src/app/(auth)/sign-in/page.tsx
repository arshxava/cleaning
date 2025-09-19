'use client';

import { Suspense } from 'react';
import SignInContent from './sign-in-content';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}
