import BookingAppointment from "@/components/BookingAppointment";
import Content from "@/components/Hero";
import Image from "next/image";
import { Bebas_Neue, Manrope } from 'next/font/google';
import About from "@/components/About";
import Services from "@/components/Services";
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeeStructure from "@/components/FeeStructure";
const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });
const manrope = Manrope({ subsets: ['latin'] });

export default function Home() {
  return (
    <>
      {/* Home Section with Gradient Background */}
      {/* <div className="flex flex-col items-center justify-center mt-60 gap-80">
        <div className="w-full h-[1000px] rounded-full bg-gradient-to-b from-[#5B89D9]/40 to-[#5B89D9]/40 blur-3xl"></div>
        <div className="w-[800px] h-[800px] rounded-full bg-gradient-to-tl from-purple-600/25 via-pink-500/20 to-transparent blur-3xl"></div>
      </div> */}

      <main className="min-h-screen w-full text-white font-sans relative">
        {/* Background Image with Gradient Overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/HowItWorks.svg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.7,
            rotate: '-180deg',
          }}
        />
        {/* <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0C111D]/90 via-[#0C111D]/70 to-[#0C111D]/90" /> */}

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <Header />

          {/* Hero Section */}
          <section id="home">
            <Hero />
          </section>

          {/* Appointment Booking */}
          <section id="booking" className="flex items-center justify-center">
            <BookingAppointment />
          </section>

          {/* Meet Scott */}
          <section id="about">
            <About />
          </section>

          {/* Services Section */}
          <section id="services">
            <Services />
          </section>

          {/* Fee Structure Section */}
          <section id="fee-structure">
            <FeeStructure />
          </section>
        </div>
      </main>
    </>
  );
}
