import Header from '@/components/Header';
import React from 'react';

export default function TermsOfServicePage() {
    return (
        <>
            <Header />
            <section className="min-h-screen w-full bg-[#000B12]/90 flex justify-center items-center py-16 px-4">
                <div className="relative w-full max-w-3xl bg-[#1a2636]/80 rounded-2xl shadow-2xl border border-white/10 p-4 md:p-14 z-10 overflow-hidden">
                    <h1 className="text-3xl md:text-5xl font-bold text-cyan-400 mb-8 text-center tracking-tight">Terms of Service</h1>
                    <p className="text-white/80 text-lg leading-relaxed mb-6">
                        Welcome to Aussiemale. By accessing or using our website, you agree to be bound by these Terms of Service.
                    </p>
                    <ol className="list-decimal list-inside space-y-6 text-white/80 text-base md:text-lg mb-6">
                        <li>
                            <span className="text-cyan-300 font-semibold">Services Provided</span>
                            <p className="text-white/70 mt-1 ml-2">
                                All health services provided through this site are within the clinical scope of a Nurse Practitioner as regulated by the Nursing and Midwifery Board of Australia (NMBA) and AHPRA.
                            </p>
                        </li>
                        <li>
                            <span className="text-cyan-300 font-semibold">Health Information Disclaimer</span>
                            <p className="text-white/70 mt-1 ml-2">
                                Content on this site is for general informational purposes only and does not constitute professional medical advice, diagnosis, or treatment.
                            </p>
                        </li>
                        <li>
                            <span className="text-cyan-300 font-semibold">Use of Third-Party Services</span>
                            <p className="text-white/70 mt-1 ml-2">
                                We integrate third-party tools like Calendly and UseBasin to facilitate bookings and contact forms. By using these tools, you agree to their respective terms.
                            </p>
                        </li>
                        <li>
                            <span className="text-cyan-300 font-semibold">Limitation of Liability</span>
                            <p className="text-white/70 mt-1 ml-2">
                                Aussiemale is not liable for any direct, indirect, incidental, or consequential damages arising from your use of this website or services.
                            </p>
                        </li>
                        <li>
                            <span className="text-cyan-300 font-semibold">User Conduct</span>
                            <p className="text-white/70 mt-1 ml-2">
                                Users are expected to use the website respectfully and not misuse forms, impersonate others, or submit false information.
                            </p>
                        </li>
                        <li>
                            <span className="text-cyan-300 font-semibold">Updates to Terms</span>
                            <p className="text-white/70 mt-1 ml-2">
                                We may update these Terms from time to time. Continued use of the site implies agreement to the revised terms.
                            </p>
                        </li>
                        <li>
                            <span className="text-cyan-300 font-semibold">Contact Information</span>
                            <p className="text-white/70 mt-1 ml-2">
                                For questions regarding these Terms, please contact us through the contact form on our website.
                            </p>
                        </li>
                    </ol>
                    <div className="absolute bottom-0 left-0 right-0 w-full z-0 opacity-60 pointer-events-none select-none">
                        <img src="/BgBlur.svg" alt="" className="w-full h-32 object-cover rounded-b-2xl" />
                    </div>
                </div>
            </section>
        </>
    );
}
