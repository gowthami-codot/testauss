import Header from '@/components/Header';
import React from 'react';

export default function PrivacyPolicyPage() {
    return (
        <>
            <Header />
            <section className="min-h-screen w-full bg-[#000B12]/90 flex justify-center items-center py-16 px-4">
                <div className="relative w-full max-w-3xl bg-[#1a2636]/80 rounded-2xl shadow-2xl border border-white/10 p-4 md:p-14 z-10 overflow-hidden">
                    <h1 className="text-3xl md:text-5xl font-bold text-cyan-400 mb-8 text-center tracking-tight">Privacy Policy</h1>
                    <p className="text-white/80 text-lg leading-relaxed mb-6">
                        Aussiemale is committed to protecting your privacy. This policy outlines how we handle your personal information when you interact with our services, including online forms and appointment scheduling.
                    </p>
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-cyan-300 mb-2">What Information We Collect</h2>
                        <p className="text-white/70 text-base leading-relaxed">
                            We collect information you provide directly to us, such as your name, email address, and message details through our contact and booking forms. We may also use cookies and analytics tools to gather non-personally identifiable information about website usage.
                        </p>
                    </div>
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-cyan-300 mb-2">How We Use Your Information</h2>
                        <p className="text-white/70 text-base leading-relaxed">
                            Information is used solely for the purposes of communication, scheduling, and service delivery. Your data is never sold or shared with third parties unless required by law.
                        </p>
                    </div>
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-cyan-300 mb-2">Third-Party Services</h2>
                        <p className="text-white/70 text-base leading-relaxed">
                            We use third-party providers like UseBasin for contact forms and Google Analytics to understand website usage. These services comply with industry standards for privacy and data protection.
                        </p>
                    </div>
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-cyan-300 mb-2">Your Rights</h2>
                        <p className="text-white/70 text-base leading-relaxed">
                            You may request access to your personal data, corrections, or deletion by contacting us directly. We will respond to requests in a timely manner in accordance with Australian privacy laws.
                        </p>
                    </div>
                    <div className="mb-2">
                        <h2 className="text-2xl font-semibold text-cyan-300 mb-2">Contact</h2>
                        <p className="text-white/70 text-base leading-relaxed">
                            If you have any questions about this privacy policy or our data handling practices, please contact us via the contact form on our homepage.
                        </p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 w-full z-0 opacity-60 pointer-events-none select-none">
                        <img src="/BgBlur.svg" alt="" className="w-full h-32 object-cover rounded-b-2xl" />
                    </div>
                </div>
            </section>
        </>
    );
}
