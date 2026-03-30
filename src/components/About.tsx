import Image from 'next/image'
import React from 'react'
import { Bebas_Neue, Manrope } from 'next/font/google';
const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'] });
const manrope = Manrope({ subsets: ['latin'] });
 
export default function About() {
    return (
        <section className="relative py-16 overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center gap-8 px-8">
                {/* Image Section */}
                <div className="relative w-full xl:w-1/2 h-[350px] md:h-[700px] xl:h-[600px]">
                    <Image
                        src="/scott2.png"
                        alt="Scott"
                        fill
                        className=" object-cover object-center"
                    />
                </div>

                {/* Content Section */}
                <div className="w-full xl:w-1/2 text-white">
                    <div className="px-4 border border-white/10 rounded-3xl mb-6 bg-gradient-to-t from-[#5B8DD9]/20 to-transparent" >
                        <h2 className={`max-xl:text-[72px] text-[128px] font-bold leading-tight ${bebasNeue.className}`}>
                            MEET <span className="text-[#2FAFFF]">SCOTT:</span>
                        </h2>
                    </div>
                    <p className={`flex flex-col gap-5 text-lg text-white leading-relaxed ${manrope.className}`}>
                        <span>
                            Scott Stringer is a Nurse Practitioner with a passion for helping men stay healthy and well.
                        </span>
                        <span>
                            With a solid clinical background and experience in emergency medicine, he has worked with blokes from all walks of life — in the mines, out bush, and behind the wire in correctional settings.
                        </span>
                        <span>
                            Based on Queensland’s Fraser Coast, Scott offers down-to-earth, personalised care that fits around your life.
                        </span>
                        <span>
                            Whether it’s at your home, the farm, or the job site, Scott’s mobile service brings health care to you — by appointment only.
                        </span>
                    </p>
                </div>
            </div>
        </section>
    )
}
