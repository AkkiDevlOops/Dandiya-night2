"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthGuard } from "@/lib/authorisedroute";

// import { useAuth } from "@/lib/gettoken";
import {
  ArrowRight,
  Check,
  Mail,
  UserRound,
  VenusAndMars,
} from "lucide-react";

import Navbar from "@/components/Navbar"


import Background from "@/components/matchingpage/backgroundblur"


const branches = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "AIML",
  "CSBS",
  "DS",
  "Other",
];

const semesters = [
  "1st Semester",
  "2nd Semester",
  "3rd Semester",
  "4th Semester",
  "5th Semester",
  "6th Semester",
  "7th Semester",
  "8th Semester",
];

const genders = [
  "Male",
  "Female",
  "Other",
  "Prefer not to say",
];



export default function ProfileFormFirst({
  student,
  onNext,
}) {
 

const router = useRouter();
  
 
 
  

  const [UserId,setuserId] = useState('')
  // const {user} = useAuth()

  const [name,setname] = useState('');
  const [enrollment,setenrollment] = useState('')
  const [login,setloginopen] = useState(false);
  const [loading,setloading] = useState(false);
    const [open,setopen] = useState(false);


  const [formData, setFormData] = useState({
    user: UserId,
    username: "",
    branch: "",
    semester: "",
    college: "",
    gender: "",
    email: "",
  });

  const [error, setError] = useState('');
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

 


  const handleNext = async(e) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      setError("Please choose a username.");
      return;
    }

    if (!formData.branch) {
      setError("Please select your branch.");
      return;
    }

    if (!formData.semester) {
      setError("Please select your semester.");
      return;
    }

    if (!formData.college) {
      setError("Please select your college.");
      return;
    }

    if (!formData.gender) {
      setError("Please select your gender.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    

    // Send data to page.jsx
    const response = await fetch('/api/saveProfile',{method:'POST',
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    console.log(data);
    if(response.ok){
      if(data.message == 'Profile completed successfully!'){
        router.push('/testimage');
      }
    }
    if(data.error){
        console.log("an error occur");
        setError(data.error);
        return;
      }
  
    
    
  };

  

  useEffect(()=>{
    // async function get(params) {
    //   const response = await fetch('/api/checkLogin',{method:"POST"});
    //   const data = await response.json();
    //   if(data){
    //   return;
    //   } 
    //   setopen(true);
    //   setTimeout(() => {
    //   router.push('/LoginRegister');
         
    //   }, 2000);
      
    //  }
    // get();
  },[])

  return (
    <div className="w-full inset-0 z-50 max-w-[700px]">

      {/* HEADER */}
    
    {open?(
          <div className="w-full min-h-screen flex justify-center items-center fixed inset-0 z-50"><p className=" h-1/4 w-1/2 flex justify-center font-bold text-red-500 items-center">complete filling your Login first</p></div>
        ):('')}
    

      <div className="rounded-[1.7rem] md:mb-10 mb-20  border border-[#741337]/10 bg-white p-5 shadow-xl shadow-[#741337]/5 sm:p-6">

        {/* VERIFIED STUDENT */}

        <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#fffaf2] px-4 py-2.5">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#741337] text-white">
            <UserRound size={16} />
          </div>

          <div className="flex-1">

            <div className="flex items-center gap-1.5">

              <h2 className="text-sm font-semibold text-[#741337]">
                {name || "Student"}
              </h2>

              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100">
                <Check
                  size={11}
                  className="text-green-600"
                />
              </span>

            </div>

            <p className="text-[10px] text-[#24151a]/40">
              Enrollment verified
              {enrollment &&
                ` • ${enrollment}`}
            </p>

          </div>

        </div>


        {/* ERROR */}

        
          <div className=" text-red-600">
            {error}
          </div>
       


        {/* FORM */}

        <form
          onSubmit={handleNext}
          className="grid grid-cols-2 gap-x-4 gap-y-3"
        >

          {/* USERNAME */}

          <div className="col-span-2">

            <label
              htmlFor="username"
              className="mb-1.5 block text-xs font-medium text-[#24151a]"
            >
              Username
            </label>

            <div className="relative">

              <UserRound
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#24151a]/30"
              />

              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="@yourname"
                autoComplete="username"
                className="h-10 w-full rounded-lg border border-[#741337]/10 bg-[#fffaf2] pl-10 pr-3 text-xs outline-none transition placeholder:text-[#24151a]/30 focus:border-[#ed7137] focus:ring-2 focus:ring-[#ed7137]/10"
              />

            </div>

          </div>


          {/* BRANCH */}

          <div>

            <label
              htmlFor="branch"
              className="mb-1.5 block text-xs font-medium text-[#24151a]"
            >
              Branch
            </label>

            <select
              id="branch"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              className="h-10 w-full rounded-lg border border-[#741337]/10 bg-[#fffaf2] px-3 text-xs outline-none transition focus:border-[#ed7137] focus:ring-2 focus:ring-[#ed7137]/10"
            >

              <option value="">
                Select branch
              </option>

              {branches.map((branch) => (
                <option
                  key={branch}
                  value={branch}
                >
                  {branch}
                </option>
              ))}

            </select>

          </div>


          {/* SEMESTER */}

          <div>

            <label
              htmlFor="semester"
              className="mb-1.5 block text-xs font-medium text-[#24151a]"
            >
              Semester
            </label>

            <select
              id="semester"
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              className="h-10 w-full rounded-lg border border-[#741337]/10 bg-[#fffaf2] px-3 text-xs outline-none transition focus:border-[#ed7137] focus:ring-2 focus:ring-[#ed7137]/10"
            >

              <option value="">
                Select semester
              </option>

              {semesters.map((semester) => (
                <option
                  key={semester}
                  value={semester}
                >
                  {semester}
                </option>
              ))}

            </select>

          </div>


          {/* COLLEGE */}

          <div className="col-span-2">

            <label className="mb-1.5 block text-xs font-medium text-[#24151a]">
              College
            </label>

            <div className="grid grid-cols-2 gap-3">

              {/* UIT */}

              <label
                className={`flex h-10 cursor-pointer items-center justify-center rounded-lg border transition ${
                  formData.college === "UIT"
                    ? "border-[#741337] bg-[#741337] text-white"
                    : "border-[#741337]/10 bg-[#fffaf2] text-[#741337] hover:border-[#ed7137]"
                }`}
              >

                <input
                  type="radio"
                  name="college"
                  value="UIT"
                  checked={formData.college === "UIT"}
                  onChange={handleChange}
                  className="sr-only"
                />

                <span className="text-xs font-semibold">
                  UIT
                </span>

              </label>


              {/* SOIT */}

              <label
                className={`flex h-10 cursor-pointer items-center justify-center rounded-lg border transition ${
                  formData.college === "SOIT"
                    ? "border-[#741337] bg-[#741337] text-white"
                    : "border-[#741337]/10 bg-[#fffaf2] text-[#741337] hover:border-[#ed7137]"
                }`}
              >

                <input
                  type="radio"
                  name="college"
                  value="SOIT"
                  checked={formData.college === "SOIT"}
                  onChange={handleChange}
                  className="sr-only"
                />

                <span className="text-xs font-semibold">
                  SOIT
                </span>

              </label>

            </div>

          </div>


          {/* GENDER */}

          <div>

            <label
              htmlFor="gender"
              className="mb-1.5 block text-xs font-medium text-[#24151a]"
            >
              Gender
            </label>

            <div className="relative">

              <VenusAndMars
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#24151a]/30"
              />

              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="h-10 w-full appearance-none rounded-lg border border-[#741337]/10 bg-[#fffaf2] pl-10 pr-3 text-xs outline-none transition focus:border-[#ed7137] focus:ring-2 focus:ring-[#ed7137]/10"
              >

                <option value="">
                  Select gender
                </option>

                {genders.map((gender) => (
                  <option
                    key={gender}
                    value={gender}
                  >
                    {gender}
                  </option>
                ))}

              </select>

            </div>

          </div>


          {/* EMAIL */}

          <div>

            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium text-[#24151a]"
            >
              Email
            </label>

            <div className="relative">

              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#24151a]/30"
              />

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-10 w-full rounded-lg border border-[#741337]/10 bg-[#fffaf2] pl-10 pr-3 text-xs outline-none transition placeholder:text-[#24151a]/30 focus:border-[#ed7137] focus:ring-2 focus:ring-[#ed7137]/10"
              />

            </div>

          </div>


          {/* NEXT */}

          <div className="col-span-2 pt-1">

            <button
              type="submit"
              
              className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#741337] text-sm font-medium text-white shadow-lg shadow-[#741337]/15 transition hover:bg-[#5d0e2b] active:scale-[0.99]"
            >

              Next

              <ArrowRight
                size={17}
                className="transition group-hover:translate-x-1"
              />

            </button>

          </div>

        </form>


        <p className="mt-3 text-center text-[10px] text-[#24151a]/35">
          You can add your Garba interests and photos on the next step.
        </p>

      </div>

      

    </div>
  );
}