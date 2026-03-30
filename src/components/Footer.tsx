"use client"
import React from 'react'
import { Twitter, Facebook, Linkedin } from 'lucide-react'
import { Manrope } from 'next/font/google'
import Link from 'next/link';
import { useRouter } from 'next/navigation';
const manrope = Manrope({ subsets: ['latin'] });

export default function Footer() {

    const router = useRouter();

    return (
        <footer className={`bg-[#00284C] text-white px-8 py-12 ${manrope.className}`}>
            <div className="mx-auto">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Left Section - Logo and Description */}
                    <div className="md:col-span-1">
                        <div className="flex items-center space-x-2 mb-6">
                            <img src="/logo.svg" alt="Logo" />
                        </div>
                        <p className={`text-[#FFFFFF] text-lg leading-relaxed max-w-sm`}>
                            Services are provided within the clinical scope of a Nurse Practitioner as regulated by the NMBA and AHPRA.
                        </p>
                    </div>

                    {/* Middle Section - Quick Links */}
                    <div className="md:col-span-1 md:mt-10">
                        <h3 className="text-lg font-semibold text-[#FFFFFF] mb-6">Quick Links</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <a href="#home" onClick={() => router.push('/')} className="block text-white/40 hover:text-white transition-colors">
                                    Home
                                </a>
                                <a href="#about" className="block text-white/40 hover:text-white transition-colors">
                                    About Me
                                </a>
                            </div>
                            <div className="space-y-3">
                                <a href="#services" className="block text-white/40 hover:text-white transition-colors">
                                    Services
                                </a>
                                <a href="#booking" className="block text-white/40 hover:text-white transition-colors">
                                    Get In Touch.
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Social Media */}
                    <div className="md:col-span-1 md:mt-10">
                        <div className="flex flex-col items-start md:items-end">
                            <div className="flex md:flex-col gap-4 space-x-4">
                                {/* <a
                                    href="#"
                                    className="w-10 h-10 border-[1.5px] border-white/40 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                                    aria-label="Twitter"
                                >
                                    <Twitter size={18} fill='white' />
                                </a> */}
                                <a
                                    href="https://www.facebook.com/p/Aussiemale-100089843237277/"
                                    target='_blank'
                                    className="w-10 h-10 border-[1.5px] border-white/40 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                                    aria-label="Facebook"
                                >
                                    <Facebook size={18} fill='white' />
                                </a>
                                {/* <a
                                    href="#"
                                    className="w-10 h-10 border-[1.5px] border-white/40 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                                    aria-label="LinkedIn"
                                >
                                    <Linkedin size={18} fill='white' />
                                </a> */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/40 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        {/* Copyright */}
                        <p className="text-gray-300 text-sm">
                            © 2025 AussieMale. All rights reserved
                        </p>

                        {/* Bottom Links */}
                        <div className="flex space-x-6 text-sm">
                            <Link href="/privacy-policy" className="text-white/80 underline hover:text-white transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="/terms-of-service" className="text-white/80 underline hover:text-white transition-colors">
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
