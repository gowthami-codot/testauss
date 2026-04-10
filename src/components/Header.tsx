'use client'
import Image from 'next/image'
import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [activeItem, setActiveItem] = useState('Home')

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    const scrollToSection = (sectionId: string) => {
        if (sectionId === 'home') {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            })
        } else {
            const element = document.getElementById(sectionId)
            if (element) {
                const headerHeight = 0 // Approximate header height
                const elementPosition = element.offsetTop - headerHeight
                window.scrollTo({
                    top: elementPosition,
                    behavior: 'smooth'
                })
            }
        }
    }

    const handleMenuClick = (item: string) => {
        setActiveItem(item)
        setIsMenuOpen(false) // Close mobile menu when item is clicked

        // Handle navigation
        if (item === 'Home') {
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            } else {
                scrollToSection('home');
            }
        } else if (item === 'Services') {
            scrollToSection('services')
        } else if (item === 'Fee Structure') {
            scrollToSection('feeStructure')
        }
    }

    const handleBookingClick = () => {
        scrollToSection('booking');
    };

    const handleLogoClick = () => {
        if (window.scrollY === 0) {
            window.location.reload();
        } else {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    return (
        <header className="bg-[#00284C33]/20 sticky top-0 z-50">
            <div className="flex justify-between items-center px-[2vw] sm:px-[3vw] lg:px-[4vw] py-[0.5vw]">
                {/* Logo */}
                <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
                    <img src="/logo2.png" alt="Logo" className='h-14 lg:h-[3vw]' />
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden xl:flex items-center space-x-[0.5vw]">
                    {['Home', 'Services', 'Fee Structure'].map((item) => (
                        <button
                            key={item}
                            onClick={() => handleMenuClick(item)}
                            className={`
                                relative px-[1vw] py-[0.5vw] lg:text-[0.8vw] text-base text-white transition-all duration-300 cursor-pointer
                                ${activeItem === item
                                    ? 'bg-gradient-to-r from-[#05BAB1] to-[#027AEF] text-white hover:text-white'
                                    : 'hover:text-[#05BAB1]'
                                }
                            `}
                            style={{
                                clipPath: activeItem === item
                                    ? 'polygon(0 0, 100% 0, 100% 100%, 15% 100%, 0 70%)'
                                    : 'none'
                            }}
                        >
                            {item}
                        </button>
                    ))}
                    <button
                        onClick={handleBookingClick}
                        className="text-white lg:text-[0.8vw] text-base font-semibold px-[1.25vw] py-[0.5vw] border cursor-pointer hover:bg-gradient-to-br hover:from-[#0583F4] hover:to-[#09B9AC] hover:border-transparent transition-all duration-300 ml-[1vw]"
                    >
                        Book Appointment
                    </button>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMenu}
                    className="xl:hidden text-white p-2 rounded-md hover:bg-gray-700 transition-colors duration-300 relative z-50"
                >
                    {isMenuOpen ? (
                        <X size={24} className="transition-transform duration-300" />
                    ) : (
                        <Menu size={24} className="transition-transform duration-300" />
                    )}
                </button>
            </div>

            {/* Mobile Navigation Menu */}
            <div className={`xl:hidden absolute top-full left-0 right-0 bg-[#0A0F1C] border-t border-gray-700 shadow-lg z-40 transform transition-all duration-300 ease-in-out ${isMenuOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-full opacity-0 pointer-events-none'
                }`}>
                <nav className="flex flex-col space-y-2 px-4 py-4">
                    {['Home', 'Services', 'Fee Structure'].map((item) => (
                        <button
                            key={item}
                            onClick={() => handleMenuClick(item)}
                            className={`
                                relative px-4 py-3 text-white transition-all duration-300 hover:text-blue-400 hover:bg-gray-800 rounded-md text-left
                                ${activeItem === item
                                    ? 'bg-gradient-to-r from-[#05BAB1] to-[#027AEF] text-white'
                                    : ''
                                }
                            `}
                        >
                            {item}
                        </button>
                    ))}
                    <button
                        onClick={handleBookingClick}
                        className="bg-white text-black font-semibold px-4 py-3 rounded-md hover:bg-gray-200 transition-colors duration-300 mt-2"
                    >
                        Book Appointment
                    </button>
                </nav>
            </div>
        </header>
    )
}
