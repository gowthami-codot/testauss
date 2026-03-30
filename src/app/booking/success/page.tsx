import { Suspense } from 'react';
import BookingSuccessClient from './BookingSuccessClient';

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#0a1628] to-[#1a2d4a] flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="animate-spin h-12 w-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-white/70 text-lg">Confirming your payment...</p>
          </div>
        </div>
      }
    >
      <BookingSuccessClient />
    </Suspense>
  );
}
