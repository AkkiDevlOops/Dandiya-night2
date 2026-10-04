"use client";

import { useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Ruler,
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
} from "lucide-react";

import { useRouter } from "next/navigation";

/* =========================================================
   INTERESTS
========================================================= */

const interests = [
  "Garba",
  "Dandiya",
  "Music",
  "Dance",
  "Photography",
  "Fashion",
  "Food",
  "Travel",
  "Fitness",
  "Movies",
  "TV",
  "Books",
  "Gaming",
  "Sports",
  "Cricket",
  "Football",
  "Badminton",
  "Basketball",
  "Art",
  "Cooking",
  "Hiking",
  "Pets",
  "Technology",
  "Business",
  "Cars",
  "Nature",
  "Nightlife",
  "Coffee",
  "Anime",
  "Podcasts",
  "Memes",
  "Coding",
  "Startups",
  "Road Trips",
  "Mountains",
  "Beaches",
  "Concerts",
  "Festivals",
  "Yoga",
  "Writing",
  "Reading",
  "Content Creation",
];

/* =========================================================
   PROMPT QUESTIONS
========================================================= */

const PROMPT_QUESTIONS = [
  "What makes a Garba night perfect for you?",

  "What should your Garba partner know about you?",

  "What's your ideal first date?",

  "What's something you can talk about for hours?",

  "What's your biggest green flag?",

  "What's your biggest red flag?",

  "What's your perfect weekend plan?",

  "What's one thing you can't live without?",

  "What's the fastest way to make you smile?",

  "What's your comfort food?",

  "What's your favourite song right now?",

  "What's your dream travel destination?",

  "What's something you're really passionate about?",

  "What's one thing on your bucket list?",

  "What's your most random talent?",

  "What does your perfect evening look like?",

  "What's something you want to learn?",

  "What's the most spontaneous thing you've done?",

  "What kind of person do you vibe with?",

  "What's your idea of a perfect road trip?",
];

/* =========================================================
   CREATE EMPTY PROMPT
========================================================= */

const createPrompt = (question = "") => ({
  question,
  answer: "",
});

/* =========================================================
   DEFAULT 3 PROMPTS
========================================================= */

const defaultPrompts = [
  createPrompt(
    PROMPT_QUESTIONS[0]
  ),

  createPrompt(
    PROMPT_QUESTIONS[1]
  ),

  createPrompt(
    PROMPT_QUESTIONS[2]
  ),
];

/* =========================================================
   COMPONENT
========================================================= */

export default function ProfileFormSecond({
  profileData,
  onBack,
  onSave,
}) {
  const router = useRouter();

  /* =======================================================
     STATE
  ======================================================= */

  const [selectedInterests, setSelectedInterests] =
    useState(
      profileData?.interests || []
    );

  const [height, setHeight] =
    useState(
      profileData?.height || ""
    );

  const [prompts, setPrompts] =
    useState(
      profileData?.prompts?.length >= 3
        ? profileData.prompts
        : defaultPrompts
    );

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  /* =======================================================
     INTEREST TOGGLE
  ======================================================= */

  const toggleInterest = (
    interest
  ) => {
    setError("");

    setSelectedInterests(
      (prev) => {
        /* REMOVE */

        if (
          prev.includes(interest)
        ) {
          return prev.filter(
            (item) =>
              item !== interest
          );
        }

        /* MAX 5 */

        if (prev.length >= 5) {
          setError(
            "Choose up to 5 interests."
          );

          return prev;
        }

        /* ADD */

        return [
          ...prev,
          interest,
        ];
      }
    );
  };

  /* =======================================================
     GET QUESTIONS ALREADY SELECTED
  ======================================================= */

  const getUsedQuestions = (
    currentIndex
  ) => {
    return prompts
      .filter(
        (_, index) =>
          index !==
          currentIndex
      )
      .map(
        (prompt) =>
          prompt.question
      )
      .filter(Boolean);
  };

  /* =======================================================
     UPDATE PROMPT
  ======================================================= */

  const updatePrompt = (
    index,
    field,
    value
  ) => {
    setError("");

    setPrompts(
      (prev) => {
        const updated = [
          ...prev,
        ];

        updated[index] = {
          ...updated[index],
          [field]: value,
        };

        return updated;
      }
    );
  };

  /* =======================================================
     ADD PROMPT
  ======================================================= */

  const addPrompt = () => {
    setError("");

    if (prompts.length >= 6) {
      setError(
        "You can add maximum 6 prompts."
      );

      return;
    }

    /* Find first unused question */

    const usedQuestions =
      prompts.map(
        (prompt) =>
          prompt.question
      );

    const availableQuestion =
      PROMPT_QUESTIONS.find(
        (question) =>
          !usedQuestions.includes(
            question
          )
      );

    setPrompts(
      (prev) => [
        ...prev,
        createPrompt(
          availableQuestion ||
            ""
        ),
      ]
    );
  };

  /* =======================================================
     REMOVE PROMPT
  ======================================================= */

  const removePrompt = (
    index
  ) => {
    setError("");

    /*
      Minimum 3 prompts are required.
    */

    if (prompts.length <= 3) {
      setError(
        "At least 3 prompts are required."
      );

      return;
    }

    setPrompts(
      (prev) =>
        prev.filter(
          (_, i) =>
            i !== index
        )
    );
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    setError("");

    /* =====================================================
       INTEREST VALIDATION
    ===================================================== */

    if (
      selectedInterests.length ===
      0
    ) {
      setError(
        "Please choose at least one interest."
      );

      return;
    }

    /* =====================================================
       HEIGHT VALIDATION
    ===================================================== */

    if (!height) {
      setError(
        "Please enter your height."
      );

      return;
    }

    const numericHeight =
      Number(height);

    if (
      !Number.isFinite(
        numericHeight
      ) ||
      numericHeight < 100 ||
      numericHeight > 250
    ) {
      setError(
        "Please enter a valid height between 100cm and 250cm."
      );

      return;
    }

    /* =====================================================
       MINIMUM 3 PROMPTS
    ===================================================== */

    if (
      prompts.length < 3
    ) {
      setError(
        "At least 3 prompts are required."
      );

      return;
    }

    /* =====================================================
       MAXIMUM 6 PROMPTS
    ===================================================== */

    if (
      prompts.length > 6
    ) {
      setError(
        "Maximum 6 prompts are allowed."
      );

      return;
    }

    /* =====================================================
       CLEAN PROMPTS
    ===================================================== */

    const cleanedPrompts =
      prompts.map(
        (prompt) => ({
          question:
            String(
              prompt.question ||
                ""
            ).trim(),

          answer:
            String(
              prompt.answer ||
                ""
            ).trim(),
        })
      );

    /* =====================================================
       VALIDATE EACH PROMPT
    ===================================================== */

    for (
      const prompt of cleanedPrompts
    ) {
      if (
        !prompt.question
      ) {
        setError(
          "Please select a question for every prompt."
        );

        return;
      }

      if (
        !prompt.answer
      ) {
        setError(
          "Please answer every prompt."
        );

        return;
      }

      if (
        prompt.question.length >
        200
      ) {
        setError(
          "Prompt question cannot exceed 200 characters."
        );

        return;
      }

      if (
        prompt.answer.length >
        1000
      ) {
        setError(
          "Prompt answer cannot exceed 1000 characters."
        );

        return;
      }
    }

    /* =====================================================
       CHECK DUPLICATE QUESTIONS
    ===================================================== */

    const questionList =
      cleanedPrompts.map(
        (prompt) =>
          prompt.question
      );

    const uniqueQuestions =
      new Set(
        questionList
      );

    if (
      uniqueQuestions.size !==
      questionList.length
    ) {
      setError(
        "Please choose a different question for each prompt."
      );

      return;
    }

    /* =====================================================
       FINAL PAYLOAD
    ===================================================== */

    const secondFormData = {
      interests:
        selectedInterests,

      height:
        numericHeight,

      prompts:
        cleanedPrompts,
    };

    try {
      setSaving(true);

      /* ===================================================
         API REQUEST
      =================================================== */

      const response =
        await fetch(
          "/api/intrestdata",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body:
              JSON.stringify(
                secondFormData
              ),
          }
        );

      const result =
        await response.json();

      /* ===================================================
         ERROR
      =================================================== */

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Something went wrong while saving your profile."
        );
      }

      /* ===================================================
         SUCCESS
      =================================================== */

      console.log(
        "Profile saved:",
        result
      );

      /* ===================================================
         UPDATE PARENT STATE
      =================================================== */

      if (onSave) {
        onSave({
          interests:
            selectedInterests,

          height:
            numericHeight,

          prompts:
            cleanedPrompts,
        });
      }

      /* ===================================================
         NEXT PAGE
      =================================================== */

      router.push(
        "/testroute"
      );
    } catch (err) {
      console.error(
        "Profile save error:",
        err
      );

      setError(
        err.message ||
          "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="h-[95vh] mb-50 overflow-y-auto rounded-2xl md:mb-0 md:w-1/2 [&::-webkit-scrollbar]:hidden">

      <div className="rounded-[1.7rem] border border-[#741337]/10 bg-white p-5 shadow-xl shadow-[#741337]/5 sm:p-6">

        {/* =================================================
            USER
        ================================================= */}

        <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#fffaf2] px-4 py-2.5">

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#741337] text-white">

            <span className="text-md font-semibold">
              {profileData?.name
                ?.charAt(0)
                ?.toUpperCase() ||
                "M"}
            </span>

          </div>

          <div>
            <p className="text-md font-semibold text-[#741337]">
              {profileData?.name ||
                "Your Profile"}
            </p>

            <p className="text-sm text-[#24151a]/40">
              Almost there —
              complete your profile
            </p>
          </div>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >

          {/* ===============================================
              INTERESTS
          =============================================== */}

          <div>

            <div className="mb-2 flex items-center gap-2">

              <Heart
                size={20}
                className="text-[#ed7137]"
              />

              <div>
                <label className="block text-md font-medium text-[#24151a]">
                  Your Interests
                </label>

                <p className="text-sm text-[#24151a]/40">
                  Pick up to 5
                </p>
              </div>

            </div>

            <div className="flex flex-wrap gap-1.5">

              {interests.map(
                (interest) => {
                  const selected =
                    selectedInterests.includes(
                      interest
                    );

                  return (
                    <button
                      key={
                        interest
                      }
                      type="button"
                      onClick={() =>
                        toggleInterest(
                          interest
                        )
                      }
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        selected
                          ? "border-[#741337] bg-[#741337] text-white"
                          : "border-[#741337]/10 bg-[#fffaf2] text-[#741337] hover:border-[#ed7137]"
                      }`}
                    >

                      {selected && (
                        <Check
                          size={10}
                          className="mr-1 inline"
                        />
                      )}

                      {interest}

                    </button>
                  );
                }
              )}

            </div>

            <p className="mt-2 text-right text-[10px] text-[#24151a]/35">
              {
                selectedInterests.length
              }
              /5 selected
            </p>

          </div>

          {/* ===============================================
              HEIGHT
          =============================================== */}

          <div>

            <div className="mb-2 flex items-center gap-2">

              <Ruler
                size={20}
                className="text-[#ed7137]"
              />

              <div>
                <label
                  htmlFor="height"
                  className="block text-md font-medium text-[#24151a]"
                >
                  Your Height
                </label>

                <p className="text-sm text-[#24151a]/40">
                  Enter your height in centimeters
                </p>
              </div>

            </div>

            <div className="relative">

              <input
                id="height"
                type="number"
                min="100"
                max="250"
                value={height}
                onChange={(e) => {
                  setHeight(
                    e.target.value
                  );
                  setError("");
                }}
                placeholder="e.g. 175"
                className="w-full rounded-xl border border-[#741337]/10 bg-[#fffaf2] px-3 py-2.5 pr-16 text-xs text-[#24151a] outline-none transition placeholder:text-[#24151a]/30 focus:border-[#ed7137] focus:ring-2 focus:ring-[#ed7137]/10"
              />

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#24151a]/40">
                cm
              </span>

            </div>

          </div>

          {/* ===============================================
              PROMPTS
          =============================================== */}

          <div>

            {/* PROMPT HEADER */}

            <div className="mb-3 flex items-center justify-between">

              <div className="flex items-center gap-2">

                <Sparkles
                  size={17}
                  className="text-[#ed7137]"
                />

                <div>
                  <label className="block text-sm font-medium text-[#24151a]">
                    Your Prompts
                  </label>

                  <p className="text-xs text-[#24151a]/40">
                    Choose at least 3
                    prompts
                  </p>
                </div>

              </div>

              {prompts.length <
                6 && (
                <button
                  type="button"
                  onClick={
                    addPrompt
                  }
                  className="flex items-center gap-1 rounded-full bg-[#741337]/5 px-3 py-1.5 text-xs font-medium text-[#741337] transition hover:bg-[#741337]/10"
                >
                  <Plus
                    size={13}
                  />

                  Add
                </button>
              )}

            </div>

            {/* PROMPT CARDS */}

            <div className="space-y-4">

              {prompts.map(
                (
                  prompt,
                  index
                ) => {

                  const usedQuestions =
                    getUsedQuestions(
                      index
                    );

                  return (
                    <div
                      key={index}
                      className="rounded-2xl border border-[#741337]/10 bg-[#fffaf2] p-4"
                    >

                      {/* PROMPT HEADER */}

                      <div className="mb-3 flex items-center justify-between">

                        <span className="text-xs font-semibold text-[#741337]/45">
                          Prompt{" "}
                          {index +
                            1}
                        </span>

                        {prompts.length >
                          3 && (
                          <button
                            type="button"
                            onClick={() =>
                              removePrompt(
                                index
                              )
                            }
                            className="flex items-center gap-1 text-xs font-medium text-red-500 transition hover:text-red-600"
                          >
                            <Trash2
                              size={13}
                            />

                            Remove
                          </button>
                        )}

                      </div>

                      {/* QUESTION DROPDOWN */}

                      <div>

                        <label className="mb-1.5 block text-xs font-medium text-[#24151a]">
                          Question
                        </label>

                        <div className="relative">

                          <select
                            value={
                              prompt.question
                            }
                            onChange={(
                              e
                            ) =>
                              updatePrompt(
                                index,
                                "question",
                                e
                                  .target
                                  .value
                              )
                            }
                            className="w-full appearance-none rounded-xl border border-[#741337]/10 bg-white px-3 py-3 pr-10 text-xs text-[#24151a] outline-none transition focus:border-[#ed7137] focus:ring-2 focus:ring-[#ed7137]/10"
                          >

                            <option
                              value=""
                            >
                              Select a question
                            </option>

                            {PROMPT_QUESTIONS.map(
                              (
                                question
                              ) => {

                                const disabled =
                                  usedQuestions.includes(
                                    question
                                  );

                                return (
                                  <option
                                    key={
                                      question
                                    }
                                    value={
                                      question
                                    }
                                    disabled={
                                      disabled
                                    }
                                  >
                                    {
                                      question
                                    }
                                  </option>
                                );
                              }
                            )}

                          </select>

                          <ChevronDown
                            size={
                              16
                            }
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#741337]/40"
                          />

                        </div>

                      </div>

                      {/* ANSWER */}

                      <div className="mt-3">

                        <label className="mb-1.5 block text-xs font-medium text-[#24151a]">
                          Your Answer
                        </label>

                        <textarea
                          value={
                            prompt.answer
                          }
                          onChange={(
                            e
                          ) =>
                            updatePrompt(
                              index,
                              "answer",
                              e
                                .target
                                .value
                            )
                          }
                          maxLength={
                            1000
                          }
                          rows={3}
                          placeholder="Write your answer..."
                          className="w-full resize-none rounded-xl border border-[#741337]/10 bg-white px-3 py-2.5 text-xs leading-relaxed text-[#24151a] outline-none transition placeholder:text-[#24151a]/30 focus:border-[#ed7137] focus:ring-2 focus:ring-[#ed7137]/10"
                        />

                        <div className="mt-1 flex justify-end">

                          <span className="text-[9px] text-[#24151a]/35">
                            {
                              prompt
                                .answer
                                ?.length ||
                              0
                            }
                            /1000
                          </span>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

            {/* ADD MORE */}

            {prompts.length <
              6 && (
              <button
                type="button"
                onClick={
                  addPrompt
                }
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#741337]/15 bg-[#fffaf2] py-3 text-xs font-medium text-[#741337] transition hover:border-[#ed7137] hover:bg-[#fdf5ed]"
              >
                <Plus
                  size={14}
                />

                Add another prompt

              </button>
            )}

            {/* PROMPT COUNT */}

            <p className="mt-2 text-center text-[10px] text-[#24151a]/35">
              {prompts.length}/6
              prompts • minimum
              3 required
            </p>

          </div>

          {/* ===============================================
              BUTTONS
          =============================================== */}

          <div className="flex items-center gap-3 pt-1">

            {/* BACK */}

            <button
              type="button"
              onClick={
                onBack
              }
              disabled={
                saving
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#741337]/10 bg-[#fffaf2] text-[#741337] transition hover:border-[#ed7137] disabled:opacity-50"
              aria-label="Go back"
            >
              <ArrowLeft
                size={17}
              />
            </button>

            {/* NEXT */}

            <button
              type="submit"
              disabled={
                saving ||
                prompts.length <
                  3
              }
              className="group flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#741337] text-sm font-medium text-white shadow-lg shadow-[#741337]/15 transition hover:bg-[#5d0e2b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {saving
                ? "Saving..."
                : "Next"}

              {!saving && (
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              )}

            </button>

          </div>

        </form>

        {/* =================================================
            FOOTER
        ================================================= */}

        <p className="mt-3 text-center text-[10px] text-[#24151a]/35">
          Keep it genuine — this
          is about finding someone
          to enjoy Garba with.
        </p>

      </div>

    </div>
  );
}




// "use client";

// import { useState } from "react";
// import {
//   ArrowLeft,
//   ArrowRight,
//   Check,
//   Heart,
//   Ruler,
//   Sparkles,
// } from "lucide-react";

// const interests = [
//   "Garba",
//   "Dandiya",
//   "Music",
//   "Dance",
//   "Photography",
//   "Fashion",
//   "Food",
//   "Travel",
//   "Fitness",
//   "Movies",
// ];

// import { useRouter } from "next/navigation";

// export default function ProfileFormSecond({
//   profileData,
//   onBack,
//   onSave,
// }) {
//    const router = useRouter();
//   const [selectedInterests, setSelectedInterests] = useState(
//     profileData?.interests || []
//   );

//   const [height, setHeight] = useState(
//     profileData?.height || ""
//   );

//   const [prompt1, setPrompt1] = useState(
//     profileData?.prompt1 || ""
//   );

//   const [prompt2, setPrompt2] = useState(
//     profileData?.prompt2 || ""
//   );

//   const [error, setError] = useState("");

//   // ================= INTEREST =================

//   const toggleInterest = (interest) => {
//     setError("");

//     setSelectedInterests((prev) => {
//       if (prev.includes(interest)) {
//         return prev.filter((item) => item !== interest);
//       }

//       if (prev.length >= 5) {
//         setError("Choose up to 5 interests.");
//         return prev;
//       }

//       return [...prev, interest];
//     });
//   }
  

  

//   // ================= NEXT =================

//     const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     // --- Frontend Validations ---
//     if (selectedInterests.length === 0) {
//       setError("Please choose at least one interest.");
//       return;
//     }
//     if (!height) {
//       setError("Please enter your height.");
//       return;
//     }
//     if (Number(height) < 100 || Number(height) > 250) {
//       setError("Please enter a valid height (between 100cm and 250cm).");
//       return;
//     }
//     if (!prompt1.trim() || !prompt2.trim()) {
//       setError("Please fill out both prompts.");
//       return;
//     }

   
//     const secondFormData = {
//       interests: selectedInterests,
//       height: Number(height),
//       prompt1: prompt1.trim(),
//       prompt2: prompt2.trim(),
//     };

//     try {
//       // --- Fetch API Request ---
//       const response = await fetch('/api/intrestdata' , {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(secondFormData),
//         credentials: 'include', // CRITICAL: Sends your encrypted session cookie automatically
//       });

//       const result = await response.json();
      
//         if(result.success){
//           router.push('/testroute');
//         }
      

//       if (!response.ok) {
//         throw new Error(result.error || 'Something went wrong saving your profile.');
//       }

//       console.log("Backend Success:", result);
      
//       // Pass data back up to the parent page state
      

//     } catch (err) {
//       setError(err.message);
//     }
//   };


      

//   return (
//     <div className="h-[95vh] mb-50 md:mb-0 rounded-2xl overflow-y-auto [&::-webkit-scrollbar]:hidden md:w-1/2">

      

     

//       {/* ================= CARD ================= */}

//       <div className="rounded-[1.7rem] border  border-[#741337]/10 bg-white p-5 shadow-xl shadow-[#741337]/5 sm:p-6">

//         {/* ================= USER ================= */}

//         <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#fffaf2] px-4 py-2.5">

//           <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#741337] text-white">
//             <span className="text-md font-semibold">
//               {profileData?.name?.charAt(0)?.toUpperCase() || "M"}
//             </span>
//           </div>

//           <div>
//             <p className="text-md font-semibold text-[#741337]">
//               {profileData?.name || "Your Profile"}
//             </p>

//             <p className="text-sm text-[#24151a]/40">
//               Almost there — complete your profile
//             </p>
//           </div>

//         </div>

//         {/* ================= ERROR ================= */}

//         {error && (
//           <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
//             {error}
//           </div>
//         )}

//         <form
//           onSubmit={handleSubmit}
//           className="space-y-4"
//         >

//           {/* ================= INTERESTS ================= */}

//           <div>
//             <div className="mb-2 flex items-center gap-2">

//               <Heart
//                 size={20}
//                 className="text-[#ed7137]"
//               />

//               <div>
//                 <label className="block text-md font-medium text-[#24151a]">
//                   Your Interests
//                 </label>

//                 <p className="text-sm text-[#24151a]/40">
//                   Pick up to 5
//                 </p>
//               </div>

//             </div>

//             <div className="flex flex-wrap gap-1.5">

//               {interests.map((interest) => {

//                 const selected =
//                   selectedInterests.includes(interest);

//                 return (
//                   <button
//                     key={interest}
//                     type="button"
//                     onClick={() =>
//                       toggleInterest(interest)
//                     }
//                     className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
//                       selected
//                         ? "border-[#741337] bg-[#741337] text-white"
//                         : "border-[#741337]/10 bg-[#fffaf2] text-[#741337] hover:border-[#ed7137]"
//                     }`}
//                   >
//                     {selected && (
//                       <Check
//                         size={10}
//                         className="mr-1 inline"
//                       />
//                     )}

//                     {interest}
//                   </button>
//                 );

//               })}

//             </div>
//           </div>

//           {/* ================= HEIGHT ================= */}

//           <div>

//             <div className="mb-2 flex items-center gap-2">

//               <Ruler
//                 size={20}
//                 className="text-[#ed7137]"
//               />

//               <div>
//                 <label
//                   htmlFor="height"
//                   className="block text-md font-medium text-[#24151a]"
//                 >
//                   Your Height
//                 </label>

//                 <p className="text-sm text-[#24151a]/40">
//                   Enter your height in centimeters
//                 </p>
//               </div>

//             </div>

//             <div className="relative">

//               <input
//                 id="height"
//                 type="number"
//                 min="100"
//                 max="250"
//                 value={height}
//                 onChange={(e) => {
//                   setHeight(e.target.value);
//                   setError("");
//                 }}
//                 placeholder="e.g. 175"
//                 className="w-full rounded-xl border border-[#741337]/10 bg-[#fffaf2] px-3 py-2.5 pr-16 text-xs text-[#24151a] outline-none transition placeholder:text-[#24151a]/30 focus:border-[#ed7137] focus:ring-2 focus:ring-[#ed7137]/10"
//               />

//               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#24151a]/40">
//                 cm
//               </span>

//             </div>

//           </div>

//           {/* ================= PROMPT 1 ================= */}

//           <div>

//             <div className="mb-2 flex items-center gap-2">

//               <Sparkles
//                 size={15}
//                 className="text-[#ed7137]"
//               />

//               <label
//                 htmlFor="prompt1"
//                 className="text-sm font-medium text-[#24151a]"
//               >
//                 What makes a Garba night perfect for you?
//               </label>

//             </div>

//             <textarea
//               id="prompt1"
//               value={prompt1}
//               onChange={(e) => {
//                 setPrompt1(e.target.value);
//                 setError("");
//               }}
//               maxLength={150}
//               rows={2}
//               placeholder="Great music, energetic Garba, good people..."
//               className="w-full resize-none rounded-xl border border-[#741337]/10 bg-[#fffaf2] px-3 py-2.5 text-xs leading-relaxed outline-none transition placeholder:text-[#24151a]/30 focus:border-[#ed7137] focus:ring-2 focus:ring-[#ed7137]/10"
//             />

//             <div className="mt-1 flex justify-end">
//               <span className="text-[9px] text-[#24151a]/35">
//                 {prompt1.length}/150
//               </span>
//             </div>

//           </div>

//           {/* ================= PROMPT 2 ================= */}

//           <div>

//             <div className="mb-2 flex items-center gap-2">

//               <Sparkles
//                 size={15}
//                 className="text-[#ed7137]"
//               />

//               <label
//                 htmlFor="prompt2"
//                 className="text-sm font-medium text-[#24151a]"
//               >
//                 What should your Garba partner know about you?
//               </label>

//             </div>

//             <textarea
//               id="prompt2"
//               value={prompt2}
//               onChange={(e) => {
//                 setPrompt2(e.target.value);
//                 setError("");
//               }}
//               maxLength={150}
//               rows={2}
//               placeholder="I'm always ready for one more round..."
//               className="w-full resize-none rounded-xl border border-[#741337]/10 bg-[#fffaf2] px-3 py-2.5 text-xs leading-relaxed outline-none transition placeholder:text-[#24151a]/30 focus:border-[#ed7137] focus:ring-2 focus:ring-[#ed7137]/10"
//             />

//             <div className="mt-1 flex justify-end">
//               <span className="text-[9px] text-[#24151a]/35">
//                 {prompt2.length}/150
//               </span>
//             </div>

//           </div>

//           {/* ================= BUTTONS ================= */}

//           <div className="flex items-center gap-3 pt-1">

//             {/* Back */}
//             <button
//               type="button"
//               onClick={onBack}
//               className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#741337]/10 bg-[#fffaf2] text-[#741337] transition hover:border-[#ed7137]"
//               aria-label="Go back"
//             >
//               <ArrowLeft size={17} />
//             </button>

//             {/* NEXT */}
//             <button
//               type="submit"
//               className="group flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#741337] text-sm font-medium text-white shadow-lg shadow-[#741337]/15 transition hover:bg-[#5d0e2b] active:scale-[0.99]"
//             >
//               Next

//               <ArrowRight
//                 size={17}
//                 className="transition group-hover:translate-x-1"
//               />
//             </button>

//           </div>

//         </form>

//         <p className="mt-3 text-center text-[10px] text-[#24151a]/35">
//           Keep it genuine — this is about finding someone to enjoy Garba with.
//         </p>

//       </div>
//     </div>
//   );
// }
