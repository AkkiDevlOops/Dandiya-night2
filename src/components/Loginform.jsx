"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

import Googlelogin from "@/components/googlelogin"
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/gettoken";
import { Amiri_Quran } from "next/font/google";
// import { useAuthGuard } from "@/lib/authorisedroute";

export default function LoginForm() {

  // const [error,setError] = useState()

  // useAuthGuard();
  const {user} = useAuth();

  const router = useRouter();
    
    const formData = useRef({
        enrollmentNo:"",
        email:"",
        password:"",
     })

     const [showPassword, setShowPassword] = useState('');
     const [error,setError] = useState('');
    
  const [isDisabled,setisDisabled] = useState(false);
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [showMobileField, setShowMobileField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadinglog, setLoadinglog] = useState(false);
  const [message, setMessage] = useState("");

    const [identifier, setIdentifier] = useState("");
      const [number , setnumber] = useState("");// Captures email or phone input string
  const [otpInput, setOtpInput] = useState("");      // Captures numerical input code string
  const [trackingToken, setTrackingToken] = useState(null); // Saved behind the scenes
  const [step, setStep] = useState(1);               // 1 = Request, 2 = Verify Code
 
  const [successMsg, setSuccessMsg] = useState("");

  // 🚀 SUBMIT HANDLER 1: Requests Email/Mobile routing access link
  const handlesubmit= async (e) => {
    e.preventDefault();
    setLoadinglog(true);
    setisDisabled(true);
    setError("");
    setSuccessMsg("");
    console.log(identifier) 
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({identifier, number}),
      });

      const data = await res.json();
              
      console.log(data);
      if (!res.ok) throw new Error(data.error || "Request failed");

      setTrackingToken(data.trackingToken); // Cache tracking state context
      setSuccessMsg(data.message);
      setStep(2); // Jump view screen to OTP layout inputs

    } catch (err) {
      setError(err.message);
    } finally {
      setLoadinglog(false);
      setTimeout(() => {
              setisDisabled(false)
            }, 7000);
    }
  };

   const handleCheckOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    setisDisabled(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: identifier,
    otp: otpInput,
    number: number,
  }),
});

const data = await response.json();

console.log(data.token);
     

      if (data.token.isLoggedIn) {
        console.log("loggedintrue")
        if (data.token.isProfileFullyUpdated) {
      router.push("/testroute");
      return;
      }
      if (data.token.isPhotoUploaded) {
      router.push("/intrestpage");
      return;
      }
      if (data.token.isFirstPhaseCompleted) {
      router.push("/testimage");
      return;
      }
      }
      router.push("/completeProfile");

       if (!res.ok) throw new Error(data.error || "Verification failed");

      setSuccessMsg("Welcome! Redirecting securely...");
     

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
   
       setTimeout(() => {
      setisDisabled(false)
       }, 7000);
    }
  };
  // Main submission function to contact the backend route


   useEffect(()=>{
   
   },[]);

  return (
    <div className="w-full max-w-md">

      {/* BRAND ICON */}
      <div className="mb-7 text-center">

        

        <div className="flex items-center justify-center gap-2">

          <h1 className="font-serif text-3xl font-bold text-[#741337]">
           Login with Email
          </h1>

          <Sparkles
            size={17}
            className="text-[#ed7137]"
          />

        </div>

        <p className="mt-2 text-sm text-[#24151a]/55">
          Ready for Garba again? Let&apos;s continue.
        </p>

      </div>


      {/* CARD */}
      <div className="rounded-[2rem] border border-[#741337]/10 bg-white p-6 shadow-xl shadow-[#741337]/5 sm:p-8">

        <form
         onSubmit={handlesubmit}
          className="space-y-5"
        >

          {/* ERROR */}
         
          {/* EnrollmentNo */}
       


          {/* EMAIL */}
          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-sm font-medium text-[#24151a]"
            >
              Email
            </label>

            <div className="relative">

              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#24151a]/35"
              />

              <input
                id="login-email"
                name="email"
              onChange={(e) => {setIdentifier(e.target.value)}}
               
                placeholder="you@college.ac.in"
                autoComplete="email"
                className="h-13 w-full rounded-xl border border-[#741337]/10 bg-[#fffaf2] pl-11 pr-4 text-sm text-[#24151a] outline-none transition placeholder:text-[#24151a]/30 focus:border-[#ed7137] focus:ring-4 focus:ring-[#ed7137]/10"
              />

            </div>

          </div>


          {/* PASSWORD */}
         
         <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-sm font-medium text-[#24151a]"
            >
              Number
            </label>

            <div className="relative">

              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#24151a]/35"
              />

              <input
                id="login-number"
                name="number"
                inputMode="numeric" // Displays the numeric keypad layout on mobile devices
                value={number}
                maxLength={10}
              onChange={(e,value) => {setnumber(e.target.value)
              }}
               
                placeholder="9234*****1"
                autoComplete="number"
                className="h-13 w-full rounded-xl border border-[#741337]/10 bg-[#fffaf2] pl-11 pr-4 text-sm text-[#24151a] outline-none transition placeholder:text-[#24151a]/30 focus:border-[#ed7137] focus:ring-4 focus:ring-[#ed7137]/10"
              />

            </div>

          </div>


          {/* REMEMBER ME */}
          <label className="flex cursor-pointer items-center gap-3 text-xs text-[#24151a]/60">

            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#741337]/20 accent-[#741337]"
            />

            Keep me signed in

          </label>


          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={isDisabled}
            
            className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#741337] font-medium text-white shadow-lg shadow-[#741337]/15 transition hover:bg-[#5d0e2b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >

           
             
          
              <>
                {loadinglog?"loading...":"Login to RaasMitra"}

                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </>
        

          </button>

        </form>
        <form onSubmit={handleCheckOtp}>
           <div>

            <div className="mt-5 mb-2 flex items-center justify-between">

              <label
                htmlFor="login-password"
                className="text-sm font-medium text-[#24151a]"
              >
               OTP
              </label>

              <Link
                href="#"
                className="text-xs font-semibold text-[#741337] hover:text-[#ed7137]"
              >
                
              </Link>

            </div>

            <div className="relative">

              <LockKeyhole
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#24151a]/35"
              />

              <input
                id="login-password"
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                
              onChange={(e)=>{
                    setOtpInput(e.target.value)
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="h-13 w-full rounded-xl border border-[#741337]/10 bg-[#fffaf2] pl-11 pr-12 text-sm text-[#24151a] outline-none transition placeholder:text-[#24151a]/30 focus:border-[#ed7137] focus:ring-4 focus:ring-[#ed7137]/10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#24151a]/40 transition hover:bg-[#fff0df] hover:text-[#741337]"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

          </div>
          <div>
           <button
           disabled={isDisabled}
           
            type="submit"
            className="group mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#741337] font-medium text-white shadow-lg shadow-[#741337]/15 transition hover:bg-[#5d0e2b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >{loading?"Loading...":"Submit"}</button></div>
        </form>
         <div className="w-full pt-3 flex justify-center">
                     <Googlelogin/>
                            </div>


        {/* VERIFIED MESSAGE */}
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#fffaf2] p-4">

          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-[#ed7137]"
          />

          <p className="text-xs leading-relaxed text-[#24151a]/55">
            Your college enrollment helps keep RaasMitra
            a genuine student community.
          </p>

        </div>


        {/* REGISTER */}
       

      </div>

    </div>
  );
}