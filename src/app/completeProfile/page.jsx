
"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import Background from "@/components/matchingpage/backgroundblur";
import ProfileFormFirst from "@/components/completeProfile/ProfileFormFirst";
import ProfileFormSecond from "@/components/completeProfile/ProfileFormSecond";

export default function CompleteProfilePage() {
  const searchParams = useSearchParams();
  const enrollment = searchParams.get("enrollment");

  const [step, setStep] = useState(1);

  const [profileData, setProfileData] = useState({
    enrollmentNo: enrollment || "",
    username: "",
    branch: "",
    semester: "",
    college: "",
    gender: "",
    email: "",
    interests: [],
    height: "",
    prompt1: "",
    prompt2: "",
  });

  // FORM 1 → FORM 2
  const handleNext = (data) => {
    console.log("STEP 1 DATA:", data);

    setProfileData((prev) => ({
      ...prev,
      ...data,
    }));

    setStep(2);
  };

  // FORM 2 → IMAGE UPLOAD
  const handleSecondNext = (data) => {
    console.log("STEP 2 DATA:", data);

    const finalProfile = {
      ...profileData,
      ...data,
    };

    console.log("FINAL PROFILE:", finalProfile);

    sessionStorage.setItem(
      "profileData",
      JSON.stringify(finalProfile)
    );

    window.location.href = "/testimage";
  };

  // FORM 2 → FORM 1
  const handleBack = () => {
    setStep(1);
  };

  

  return (
    <>
    <div className="flex min-h-screen  justify-center items-center">
      <Background/>
      <ProfileFormFirst/></div>
    
    </>
  );
}