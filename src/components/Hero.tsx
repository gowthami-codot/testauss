import Image from 'next/image'
import React from 'react'
import { Bebas_Neue, Manrope } from 'next/font/google';
const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });
const manrope = Manrope({ weight: '400', subsets: ['latin'] });

export default function Hero() {
    return (
        <section className="relative py-16 xl:py-24 px-6 mb-10 xl:px-0 overflow-hidden flex flex-col justify-center">
            <div className="mx-auto flex flex-col-reverse xl:flex-row gap-10 items-center justify-between">
                {/* Text Content */}
                <div className={`z-10 mt-8 xl:mt-5 xl:mb-0 text-center xl:text-left ${bebasNeue.className}`}>
                    <h1 className="text-6xl xl:text-8xl 2xl:text-[6.667vw] text-nowrap font-normal">
                        YOUR <span className='text-[#2FAFFF]'>Health</span>,
                        <br />
                        YOUR <span className='text-[#2FAFFF]'>Strength</span>
                    </h1>

                    <p className={`mt-4 xl:w-[440px] font-normal text-[#FFFFFF] text-lg xl:text-xl ${manrope.className}`}>
                        Professional men's healthcare services you can trust - private, respectful, and on your terms.
                    </p>
                </div>

                {/* Profile image */}
                <div className="w-full flex justify-center items-center z-0">
                    <Image
                        src="/scott.png"
                        alt="Health care Professional"
                        width={0}
                        height={0}
                        sizes="(min-width: 1280px) 30vw, 60vw"
                        className="object-cover w-[60vw] h-full xl:w-[30vw] max-w-none"
                    />
                </div>
            </div>

            {/* Decorative blue bar */}
            <div className="hidden xl:flex relative -mt-20 w-full h-9 z-10">
                <img src="/bar1.svg" alt="" className="object-cover w-xs h-full" />
            </div>
            <div className="hidden xl:flex relative mt-6 w-[180%] h-9 z-10">
                <img src="/bar2.svg" alt="" className="h-10 object-contain" />
            </div>
        </section>
    )
}
