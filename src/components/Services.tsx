'use client';

import React, { useState } from 'react';
import { Bebas_Neue, Manrope } from 'next/font/google';
const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });
const manrope = Manrope({ subsets: ['latin'] });

export default function Services() {
    // <div className="lg:absolute lg:left-1/14 lg:top-1/2 lg:-translate-y-1/2 lg:-translate-x-1/2 lg:-rotate-90 
    //               w-full text-center lg:text-left mb-10 lg:mb-0 lg:bg-gradient-to-l lg:from-[#006AC0FA]/30 lg:to-transparent lg:origin-center">
    //     <h1 className={`${bebasNeue.className} text-white/30 text-[60px] lg:text-[115px] font-bold whitespace-nowrap tracking-[0.02em]`}>
    //         BOOK APPOINTMENT
    //     </h1>
    // </div>

    return (
        <>
            <div className="bg-[#000B1266] flex justify-center p-6 relative xl:mx-20 md:mx-20 mx-auto h-full">
                <div className="absolute xl:right-1/16 xl:bg-transparent xl:top-1/2 w-fit md:px-[168px] xl:-translate-y-1/2 xl:translate-x-1/2 xl:-rotate-[270deg] xl:bg-gradient-to-l from-[#006AC0FA]/10 to-transparent text-center xl:text-left mb-10 xl:mb-0 origin-center">
                    <h1 className={`${bebasNeue.className} text-white/20 text-[60px] xl:text-[115px] font-bold md:whitespace-nowrap tracking-[0.02em]`}>
                        services
                    </h1>
                </div>
                <div className="w-full xl:mr-40 ml-0 xl:my-10 md:mt-28 mt-36 max-w-3xl z-10">
                    <h2 className={`${bebasNeue.className} text-white text-4xl text-center md:leading-[48px] xl:leading-[72px] mb-14 xl:text-6xl font-bold`}>
                        <span className="text-[#2FAFFF]">Expert Healthcare, </span>Tailored for You
                    </h2>

                    <div className="flex flex-wrap justify-center items-center gap-10 max-w-7xl">
                        {[
                            "Men's Health & Wellness Checks",
                            "Sexual Health, STI Screening, PrEP",
                            "Medical Certificates",
                            "Referrals to Specialists",
                            "Pathology & Diagnostics",
                            "Vaccinations",
                        ].map((service, idx) => (
                            <div
                                key={idx}
                                className={`bg-[#FFFFFF1A] hover:bg-[#FFFFFF3D] transform duration-200 p-6 h-24 text-white text-center text-lg flex flex-col justify-center text-nowrap w-[350px] ${manrope.className}`}
                            >
                                <span>{service}</span>
                                <div className="mt-4 flex justify-center">
                                    <hr className="w-full h-0.5 border-t border-[#FFFFFF33]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 w-full z-0 overflow-hidden">
                    <img src="/BgBlur.svg" alt="" className="w-full h-full object-cover" />
                </div>
            </div>
        </>
    );
}
