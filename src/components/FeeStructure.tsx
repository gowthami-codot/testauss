import React from "react";
import { Bebas_Neue, Manrope } from "next/font/google";

const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"] });
const manrope = Manrope({ weight: "400", subsets: ["latin"] });
const manrope600 = Manrope({ weight: "600", subsets: ["latin"] });
const manrope500 = Manrope({ weight: "500", subsets: ["latin"] });

export default function FeeStructure() {
  return (
    <section id="feeStructure" className="w-full text-white  pt-10 lg:pt-[110px] relative bg-black">
      <div className=" mx-auto">
        {/* Title pill */}
        <div className="mx-auto mb-16 md:mb-[132px] flex justify-center px-4">
          <div
            className="relative w-full max-w-[1037px] min-h-[100px] md:min-h-[144px] rounded-[24px] p-4 md:p-6 overflow-hidden flex items-center justify-center"
          >
            <img
              src="/FeatureStructurePill.svg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
            <div className="relative z-10 w-full flex items-center justify-center px-2">
              <h1
                className={`${bebasNeue.className} text-[36px] leading-[40px] sm:text-[50px] sm:leading-[56px] md:text-[80px] md:leading-[80px] lg:text-[128px] lg:leading-[96px] font-normal tracking-[0%] text-center`}
              >
                <span className="text-white/90">FEE </span>
                <span className=" text-[#2FAFFF]">STRUCTURE</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Medicare header */}
        <h2
          className={`${bebasNeue.className} text-[32px] leading-[40px] sm:text-[40px] sm:leading-[48px] md:text-[56px] md:leading-[72px] lg:text-[64px] lg:leading-[96px] font-normal text-center tracking-[0%] px-4`}
        >
          <span className="text-[#2FAFFF]"> MEDICARE CARD </span> <span className="text-white/90" >HOLDERS</span>
        </h2>

        {/* Medicare card */}
        <div className="mt-8 flex justify-center px-4 w-full">
          <div className="relative max-w-[1166px] w-full max-xl:min-h-[400px] xl:aspect-[1166/552] overflow-hidden border border-white/30 backdrop-blur-3xl flex flex-col items-center justify-center py-12 lg:py-[90px]">
            {/* Background image covering the grid gracefully - fill strictly on mobile to retain entire borders, contain natively mapped to strict aspect ratio globally elsewhere! */}
            <img
              src="/MedicareCard.svg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover xl:object-contain pointer-events-none opacity-80"
            />

            <div className="relative z-10 text-center w-full px-4 flex flex-col items-center justify-start h-full">
              <div className="w-full max-w-[686px] mb-8 md:mb-6 lg:mb-[60px]">
                <div
                  className={`${manrope600.className} text-[#D7F4FE] text-[32px] leading-[40px] sm:text-[40px] sm:leading-[48px] md:text-[56px] md:leading-[64px] lg:text-[80px] lg:leading-[80px] font-semibold tracking-[-0.05em]`}
                >
                  Bulk Billed Care,
                  <br />
                  Zero Out of Pocket
                </div>
              </div>

              {/* Wrapper for the text boxes and the precise vertical Divider */}
              <div className="relative w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4 lg:gap-8 max-w-[900px] sm:mt-0 md:mt-10 lg:mt-0">
                {/* Center divider line securely locked exactly between the text rows dynamically */}
                <img
                  src="/MedicareDividerLine.svg"
                  alt=""
                  className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 h-full object-contain pointer-events-none"
                />

                <div
                  className={`flex flex-col items-center justify-start text-center ${manrope500.className} w-full max-w-[299px] mx-auto relative z-10`}
                >
                  <p className="text-[#E6F6FF] opacity-80 text-[16px] leading-[24px] md:text-[20px] md:leading-[28px] lg:text-[24px] lg:leading-[32px] tracking-[0%]">
                    Eligible Services Are 100% Bulk Billed, Meaning There Is No
                    Out-Of-Pocket Cost Where Medicare Criteria Are Met.
                  </p>
                </div>

                <div
                  className={`flex flex-col items-center justify-start text-center ${manrope500.className} w-full max-w-[299px] mx-auto relative z-10`}
                >
                  <p className="text-[#E6F6FF] opacity-80 text-[16px] leading-[24px] md:text-[20px] md:leading-[28px] lg:text-[24px] lg:leading-[32px] tracking-[0%]">
                    To Remain Eligible For Medicare Bulk Billing, Scott Must See
                    You In Person At Least Once Per Calendar Year, Otherwise,
                    The Full-Fee Applies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Non-medicare header + background layer (content can be filled later) */}
        <h2
          className={`${bebasNeue.className} mt-[72px] md:mt-[110px] text-[32px] leading-[40px] sm:text-[40px] sm:leading-[48px] md:text-[56px] md:leading-[72px] lg:text-[64px] lg:leading-[96px] font-normal text-center tracking-[0%] px-4`}
        >
          <span className="bg-gradient-to-b from-[#38C4FF] to-[#027AEF] bg-clip-text text-transparent"> NON MEDICARE CARD </span> <span className="text-white/90" >HOLDERS</span>
        </h2>

        <div className="flex justify-center w-full mt-8 md:mt-0">
          <div className="relative w-full min-h-[400px] overflow-hidden">
            <div
              className="relative w-full min-h-[400px] p-0 overflow-hidden"
            >
              {/* Bottom blur behind the fee cards (same idea as Services) */}
              <div className="absolute bottom-0 left-0 right-0 w-full z-0 overflow-hidden pointer-events-none h-full">
                <img
                  src="/NonMedicareBg.svg"
                  alt=""
                  className="w-full object-cover h-full opacity-100"
                />
              </div>

              {/* Fee cards */}
              <div className="relative z-10 flex flex-row flex-wrap justify-center items-center gap-6 lg:gap-10 xl:gap-14 pt-10 md:pt-12 pb-[60px] md:pb-[110px] max-w-[1166px] mx-auto">
                {[
                  {
                    price: "$64.00",
                    text: "New Patient Consultation,\nIncluding Comprehensive\nMedical History And\nAssessment",
                  },
                  {
                    price: "$32.00",
                    text: "Follow Up Consultation Or\nFocused Assessment/\nIntervention",
                  },
                  {
                    price: "$16.00",
                    text: "Quick, Straightforward\nRequest (Simple Issue, Such\nAs A Medical Certificate)",
                  },
                ].map((card, idx) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={idx}
                    className="bg-[#FFFFFF1A] hover:bg-[#FFFFFF3D] transform duration-200 px-4 sm:px-6 pt-[60px] md:pt-[96px] pb-8 md:pb-10 w-full max-w-[340px] min-h-[260px] md:min-h-[360px] text-center flex flex-col items-center justify-start rounded-none"
                  >
                    <div className={`${manrope600.className} text-[#D7F4FE] text-[40px] leading-[48px] sm:text-[48px] sm:leading-[56px] md:text-[64px] md:leading-[64px] lg:text-[80px] lg:leading-[80px] tracking-[-0.06em] mb-4 md:mb-8`}>
                      {card.price}
                    </div>
                    <div className={`${manrope.className} text-[#E6F6FF]/70 text-[14px] leading-[20px] sm:text-[16px] sm:leading-[22px] md:text-[18px] md:leading-[24px] lg:text-[20px] lg:leading-[27px] tracking-[0%] whitespace-pre-line max-w-[280px] mx-auto`}>
                      {card.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

