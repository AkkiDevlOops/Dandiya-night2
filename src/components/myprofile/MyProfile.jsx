"use client";

import {
  ArrowLeft,
  Camera,
  ChevronRight,
  Pencil,
  Plus,
  X,
} from "lucide-react";

import Background from "@/components/matchingpage/backgroundblur";
import { useEffect, useState } from "react";

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null);

  const [username, setUsername] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [intro, setIntro] = useState("");

  const [interests, setInterests] = useState([]);
  const [prompts, setPrompts] = useState([]);

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/myprofile");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Could not load your profile."
        );
      }

      const profile = data.users;

      setUser(profile);

      setUsername(profile?.username || "");
      setBranch(profile?.branch || "");
      setSemester(profile?.semester || "");
      setIntro(profile?.intro || "");

      setInterests(
        Array.isArray(profile?.interests)
          ? profile.interests
          : []
      );

      setPrompts(
        Array.isArray(profile?.prompts)
          ? profile.prompts
          : []
      );
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Could not connect to the profile server."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // UPDATE PROFILE
  // --------------------------------------------------

  const updateProfile = async (updates) => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "/api/updateprofile",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Could not update profile."
        );
      }

      const updatedUser =
        data.users || data.user || data.profile;

      if (updatedUser) {
        setUser(updatedUser);

        setUsername(
          updatedUser.username || ""
        );

        setBranch(
          updatedUser.branch || ""
        );

        setSemester(
          updatedUser.semester || ""
        );

        setIntro(
          updatedUser.intro || ""
        );

        setInterests(
          Array.isArray(updatedUser.interests)
            ? updatedUser.interests
            : []
        );

        setPrompts(
          Array.isArray(updatedUser.prompts)
            ? updatedUser.prompts
            : []
        );
      } else {
        await getProfile();
      }

      setEditing(null);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Could not update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // SAVE BASIC PROFILE
  // --------------------------------------------------

  const saveBasicProfile = () => {
    updateProfile({
      username,
      branch,
      semester,
      intro,
    });
  };

  // --------------------------------------------------
  // SAVE INTERESTS
  // --------------------------------------------------

  const saveInterests = () => {
    updateProfile({
      interests,
    });
  };

  // --------------------------------------------------
  // SAVE PROMPT
  // --------------------------------------------------

  const savePrompt = (index, question, answer) => {
    const updatedPrompts = [...prompts];

    updatedPrompts[index] = {
      ...updatedPrompts[index],
      question,
      answer,
    };

    setPrompts(updatedPrompts);

    updateProfile({
      prompts: updatedPrompts,
    });
  };

  // --------------------------------------------------
  // REMOVE INTEREST
  // --------------------------------------------------

  const removeInterest = (interest) => {
    const updated = interests.filter(
      (item) => item !== interest
    );

    setInterests(updated);

    updateProfile({
      interests: updated,
    });
  };

  if (loading) {
    return (
      <main className="h-dvh overflow-hidden bg-[#fffaf2]">
        <div className="fixed inset-0 z-10">
          <Background />
        </div>

        <div className="fixed inset-0 z-50 mx-auto flex h-full w-full max-w-[500px] items-center justify-center bg-white">
          <p className="text-sm text-[#741337]">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#fffaf2]">
      <div className="fixed inset-0 z-10">
        <Background />
      </div>

      <div className="fixed inset-0 z-50 mx-auto flex h-full w-full max-w-[500px] flex-col bg-white">

        {/* ================= HEADER ================= */}

        <div className="flex shrink-0 items-center justify-between border-b border-[#741337]/10 px-4 py-3">

          <a href="/testroute">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#741337] hover:bg-[#fff0df]"
            >
              <ArrowLeft size={20} />
            </button>
          </a>

          <h1 className="font-serif text-xl font-bold text-[#24151a]">
            My Profile
          </h1>

          <div className="w-9" />

        </div>

        {/* ================= SCROLL AREA ================= */}

        <div className="flex-1 overflow-y-auto px-4 pb-8">

          {/* ================= ERROR ================= */}

          {error && (
            <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-center text-xs text-red-500">
              {error}
            </div>
          )}

          {/* ================= PHOTOS ================= */}

          <section className="mt-5">

            <div className="mb-2 flex items-center justify-between">

              <div>
                <h2 className="font-serif text-lg font-bold text-[#741337]">
                  Your Photos
                </h2>

                <p className="text-[10px] text-[#24151a]/45">
                  Show your best moments
                </p>
              </div>

              <Camera
                size={18}
                className="text-[#741337]"
              />

            </div>

            <div className="grid grid-cols-3 gap-2">

              {Array.from({
                length: 6,
              }).map((_, index) => {

                const photo =
                  user?.images?.[index];

                return (
                  <div
                    key={index}
                    className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-[#741337]/10 bg-[#fffaf2]"
                  >

                    {photo ? (
                      <>
                        <img
                          src={photo}
                          alt={`Profile ${index + 1}`}
                          className="h-full w-full object-cover"
                        />

                        <button
                          type="button"
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"
                        >
                          <Pencil size={12} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="flex h-full w-full flex-col items-center justify-center text-[#741337]/50"
                      >
                        <Plus size={23} />

                        <span className="mt-1 text-[9px]">
                          Add photo
                        </span>
                      </button>
                    )}

                  </div>
                );
              })}

            </div>

          </section>

          {/* ================= BASIC INFO ================= */}

          <section className="mt-6">

            <div className="mb-2 flex items-center justify-between">

              <h2 className="font-serif text-lg font-bold text-[#741337]">
                About You
              </h2>

              <button
                type="button"
                onClick={() =>
                  setEditing("basic")
                }
                className="flex items-center gap-1 text-xs font-semibold text-[#741337]"
              >
                <Pencil size={13} />
                Edit
              </button>

            </div>

            <div className="rounded-2xl border border-[#741337]/10 bg-white p-4 shadow-sm">

              <h3 className="font-serif text-[23px] font-bold text-[#741337]">
                {username || "Your name"}
              </h3>

              <p className="mt-1 text-xs text-[#24151a]/55">
                {semester || "Semester"}

                <span className="mx-1.5 text-[#ed7137]">
                  •
                </span>

                {branch || "Branch"}
              </p>

              {intro && (
                <div className="mt-3 rounded-xl bg-[#fffaf2] px-3 py-3">

                  <p className="text-xs italic leading-5 text-[#24151a]/65">
                    {intro}
                  </p>

                </div>
              )}

            </div>

          </section>

          {/* ================= BASIC EDITOR ================= */}

          {editing === "basic" && (
            <div className="mt-3 rounded-2xl border border-[#741337]/10 bg-[#fffaf2] p-4">

              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="Username"
                className="mb-2 w-full rounded-xl border border-[#741337]/10 bg-white px-3 py-3 text-sm outline-none focus:border-[#741337]"
              />

              <input
                value={semester}
                onChange={(e) =>
                  setSemester(e.target.value)
                }
                placeholder="Semester"
                className="mb-2 w-full rounded-xl border border-[#741337]/10 bg-white px-3 py-3 text-sm outline-none focus:border-[#741337]"
              />

              <input
                value={branch}
                onChange={(e) =>
                  setBranch(e.target.value)
                }
                placeholder="Branch"
                className="mb-2 w-full rounded-xl border border-[#741337]/10 bg-white px-3 py-3 text-sm outline-none focus:border-[#741337]"
              />

              <textarea
                value={intro}
                onChange={(e) =>
                  setIntro(e.target.value)
                }
                placeholder="Tell people a little about yourself..."
                rows={3}
                className="w-full resize-none rounded-xl border border-[#741337]/10 bg-white px-3 py-3 text-sm outline-none focus:border-[#741337]"
              />

              <div className="mt-3 flex gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setEditing(null)
                  }
                  className="flex-1 rounded-xl border border-[#741337]/15 bg-white py-2.5 text-xs font-semibold text-[#741337]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={saveBasicProfile}
                  className="flex-1 rounded-xl bg-[#741337] py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save"}
                </button>

              </div>

            </div>
          )}

          {/* ================= PROMPTS ================= */}

          <section className="mt-7">

            <div className="mb-2 flex items-center justify-between">

              <div>
                <h2 className="font-serif text-lg font-bold text-[#741337]">
                  Your Prompts
                </h2>

                <p className="text-[10px] text-[#24151a]/45">
                  Let people know what makes you, you
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditing("newPrompt")
                }
                className="flex items-center gap-1 text-xs font-semibold text-[#741337]"
              >
                <Plus size={14} />
                Add
              </button>

            </div>

            <div className="space-y-3">

              {prompts.length === 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setEditing("newPrompt")
                  }
                  className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#741337]/20 bg-[#fffaf2] py-8 text-[#741337]"
                >
                  <Plus size={24} />

                  <span className="mt-2 text-xs font-semibold">
                    Add your first prompt
                  </span>
                </button>
              )}

              {prompts.map(
                (prompt, index) => (
                  <PromptCard
                    key={index}
                    prompt={prompt}
                    index={index}
                    editing={editing}
                    setEditing={setEditing}
                    savePrompt={savePrompt}
                    saving={saving}
                  />
                )
              )}

            </div>

          </section>

          {/* ================= INTERESTS ================= */}

          <section className="mt-7">

            <div className="mb-2 flex items-center justify-between">

              <div>
                <h2 className="font-serif text-lg font-bold text-[#741337]">
                  Interests
                </h2>

                <p className="text-[10px] text-[#24151a]/45">
                  Things you enjoy
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditing("interests")
                }
                className="flex items-center gap-1 text-xs font-semibold text-[#741337]"
              >
                <Pencil size={13} />
                Edit
              </button>

            </div>

            <div className="rounded-2xl border border-[#741337]/10 bg-white p-4 shadow-sm">

              <div className="flex flex-wrap gap-2">

                {interests.length === 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setEditing("interests")
                    }
                    className="flex items-center gap-1 rounded-full border border-dashed border-[#741337]/20 px-3 py-2 text-xs text-[#741337]"
                  >
                    <Plus size={13} />
                    Add interests
                  </button>
                ) : (
                  interests.map(
                    (interest, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-[#fff0df] px-3 py-2 text-xs font-medium text-[#741337]"
                      >
                        {interest}
                      </span>
                    )
                  )
                )}

              </div>

            </div>

          </section>

          {/* ================= INTEREST EDITOR ================= */}

          {editing === "interests" && (
            <InterestEditor
              interests={interests}
              setInterests={setInterests}
              saveInterests={saveInterests}
              saving={saving}
            />
          )}

          {/* ================= FOOTER ================= */}

          <p className="pb-3 pt-8 text-center text-[9px] text-[#24151a]/30">
            Made for the Garba community ✨
          </p>

        </div>
      </div>
    </main>
  );
}

// ==================================================
// PROMPT CARD
// ==================================================

function PromptCard({
  prompt,
  index,
  editing,
  setEditing,
  savePrompt,
  saving,
}) {
  const [question, setQuestion] =
    useState(prompt?.question || "");

  const [answer, setAnswer] =
    useState(prompt?.answer || "");

  const isEditing =
    editing === `prompt-${index}`;

  return (
    <div className="rounded-2xl border border-[#741337]/10 bg-white p-4 shadow-sm">

      {isEditing ? (
        <>
          <input
            value={question}
            onChange={(e) =>
              setQuestion(e.target.value)
            }
            placeholder="Prompt question"
            className="mb-2 w-full rounded-xl border border-[#741337]/10 bg-[#fffaf2] px-3 py-3 text-xs font-semibold outline-none focus:border-[#741337]"
          />

          <textarea
            value={answer}
            onChange={(e) =>
              setAnswer(e.target.value)
            }
            placeholder="Your answer..."
            rows={4}
            className="w-full resize-none rounded-xl border border-[#741337]/10 bg-[#fffaf2] px-3 py-3 text-sm outline-none focus:border-[#741337]"
          />

          <div className="mt-3 flex gap-2">

            <button
              type="button"
              onClick={() =>
                setEditing(null)
              }
              className="flex-1 rounded-xl border border-[#741337]/15 py-2.5 text-xs font-semibold text-[#741337]"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                savePrompt(
                  index,
                  question,
                  answer
                )
              }
              className="flex-1 rounded-xl bg-[#741337] py-2.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save"}
            </button>

          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">

            <div className="flex-1">

              <p className="text-[11px] font-semibold text-[#741337]">
                {prompt?.question ||
                  "Prompt"}
              </p>

              <p className="mt-2 text-sm leading-6 text-[#24151a]">
                {prompt?.answer ||
                  "Add your answer"}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setEditing(
                  `prompt-${index}`
                )
              }
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff0df] text-[#741337]"
            >
              <Pencil size={13} />
            </button>

          </div>
        </>
      )}

    </div>
  );
}

// ==================================================
// INTEREST EDITOR
// ==================================================

function InterestEditor({
  interests,
  setInterests,
  saveInterests,
  saving,
}) {
  const [value, setValue] =
    useState("");

  const addInterest = () => {
    const cleanValue =
      value.trim();

    if (!cleanValue) return;

    if (
      interests.includes(
        cleanValue
      )
    ) {
      setValue("");
      return;
    }

    setInterests([
      ...interests,
      cleanValue,
    ]);

    setValue("");
  };

  const removeInterest = (
    interest
  ) => {
    setInterests(
      interests.filter(
        (item) =>
          item !== interest
      )
    );
  };

  return (
    <div className="mt-3 rounded-2xl border border-[#741337]/10 bg-[#fffaf2] p-4">

      <div className="flex gap-2">

        <input
          value={value}
          onChange={(e) =>
            setValue(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addInterest();
            }
          }}
          placeholder="Add an interest"
          className="flex-1 rounded-xl border border-[#741337]/10 bg-white px-3 py-3 text-xs outline-none focus:border-[#741337]"
        />

        <button
          type="button"
          onClick={addInterest}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#741337] text-white"
        >
          <Plus size={17} />
        </button>

      </div>

      <div className="mt-3 flex flex-wrap gap-2">

        {interests.map(
          (interest, index) => (
            <button
              type="button"
              key={index}
              onClick={() =>
                removeInterest(
                  interest
                )
              }
              className="flex items-center gap-1 rounded-full bg-[#fff0df] px-3 py-2 text-xs font-medium text-[#741337]"
            >
              {interest}

              <X size={12} />
            </button>
          )
        )}

      </div>

      <button
        type="button"
        disabled={saving}
        onClick={saveInterests}
        className="mt-4 w-full rounded-xl bg-[#741337] py-3 text-xs font-semibold text-white disabled:opacity-50"
      >
        {saving
          ? "Saving..."
          : "Save Interests"}
      </button>

    </div>
  );
}



// "use client";

// import {
//   ArrowLeft,
//   ChevronRight,
//   CircleHelp,
//   LogOut,
//   Pencil,
//   Settings,
// } from "lucide-react";

// import Background from "@/components/matchingpage/backgroundblur";
// import { useEffect, useRef, useState } from "react";

// export default function MyProfile() {
//      const [error,setError] = useState('');
//     const [user, setuser] = useState();
//     const [image,setimage] = useState('');
//     const [name,setname] = useState('');
//      const [branch,setbranch] = useState('');
//       const [year,setyear] = useState('');
 
  
 
//   useEffect(()=>{
//    const getprofile = async()=>{
//      try{
//     const response = await fetch("api/myprofile");
//    const data = await response.json();
//    const users = data.users;
//    console.log(users);
//    if(response.ok){
//     setname(users.username)
//     setimage(users.images[0])
//     setbranch(users.branch)
//     setyear(users.semester)
    
//    }
//  }    catch (err) {
//          console.error(err);
//          setError("Could not connect to the profile directory server.");
//        } }
//        getprofile();
     
//     },[]);
   

//   return (
//     <main className="h-dvh overflow-hidden bg-[#fffaf2]">
//         <div className="inset-0 z-10 fixed">
//           <Background />
//         </div>

//       <div className="mx-auto flex h-full w-full bg-white inset-0 z-50 fixed max-w-[500px] flex-col px-4 py-3 sm:px-6">

//         {/* ================= HEADER ================= */}

//         <div className="flex shrink-0 items-center justify-between">
//           <a href="/testroute">
//           <button
//             type="button"
//             className="flex h-9 w-9 items-center justify-center rounded-full text-[#741337] hover:bg-[#fff0df]"
//           >
//             <ArrowLeft size={20} />
//           </button></a>

//           <h1 className="font-serif text-xl font-bold text-[#24151a]">
//             My Profile
//           </h1>

//           <div className="w-9" />

//         </div>


//         {/* ================= PROFILE CARD ================= */}

//         <div className="mt-3 shrink-0 rounded-[24px] border border-[#741337]/10 bg-white px-5 py-4 text-center shadow-sm">

//           {/* IMAGE */}

//           <div className="relative mx-auto mb-2 h-[88px] w-[88px]">

//             <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-full bg-[#fff0df]" />

//             <img
//               src={image? image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS73OboNq8YpolvhWur1kpvkaggtHmHEzhY7RPohICuOA&s=10"}
//               alt={name}
//               className="relative h-full w-full rounded-full border-[3px] border-white object-cover shadow"
//             />

//           </div>


//           {/* NAME */}

//           <h2 className={name?"font-serif text-[23px] font-bold leading-tight text-[#741337]":"font-serif text-[23px] font-bold leading-tight text-[#741337] text-green-400"}>
//             {name?name:"Loading..."}
            
//           </h2>


//           {/* DETAILS */}

//           <p className="mt-0.5 text-xs text-[#24151a]/55">
//          {year}
//             <span className="mx-1.5 text-[#ed7137]">
//               •
//             </span>
//             {branch}
//           </p>


//           {/* INTRO */}

//           <div className="mx-auto mt-2.5 max-w-[330px] rounded-xl bg-[#fffaf2] px-3 py-2">

//             <p className="text-xs italic text-[#24151a]/65">
//               intro
//             </p>

//           </div>

//         </div>


//         {/* ================= CONNECTIONS ================= */}

//         <div className="mt-3 flex shrink-0 items-center justify-between rounded-2xl border border-[#741337]/10 bg-white px-4 py-3 shadow-sm">

//           <div>

//             <p className="text-xs font-semibold text-[#24151a]">
//               Your Connections
//             </p>

//             <p className="text-[11px] text-[#24151a]/40">
//               People you've connected with
//             </p>

//           </div>

//           <div className="flex h-9 min-w-[45px] items-center justify-center rounded-xl bg-[#fff0df]">

//             <span className="text-base font-bold text-[#741337]">
//               connections
//             </span>

//           </div>

//         </div>


//         {/* ================= MENU ================= */}

//         <div className="mt-3 shrink-0 overflow-hidden rounded-[20px] border border-[#741337]/10 bg-white shadow-sm">

//           {/* EDIT PROFILE */}

//           <button
//             type="button"
//             className="group flex h-[58px] w-full items-center gap-3 border-b border-[#741337]/8 px-4 text-left hover:bg-[#fffaf2]"
//           >

//             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fff0df]">
//               <Pencil
//                 size={15}
//                 className="text-[#741337]"
//               />
//             </div>

//             <div className="flex-1">

//               <p className="text-xs font-medium text-[#24151a]">
//                 Edit Profile
//               </p>

//               <p className="text-[9px] text-[#24151a]/40">
//                 Photos, interests & Garba vibe
//               </p>

//             </div>

//             <ChevronRight
//               size={17}
//               className="text-[#24151a]/25"
//             />

//           </button>


//           {/* SETTINGS */}

//           <button
//             type="button"
//             className="group flex h-[58px] w-full items-center gap-3 border-b border-[#741337]/8 px-4 text-left hover:bg-[#fffaf2]"
//           >

//             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fff0df]">
//               <Settings
//                 size={15}
//                 className="text-[#911542]"
//               />
//             </div>

//             <div className="flex-1">

//               <p className="text-xs font-medium text-[#24151a]">
//                 Settings
//               </p>

//               <p className="text-[9px] text-[#24151a]/40">
//                 Account information & preferences
//               </p>

//             </div>

//             <ChevronRight
//               size={17}
//               className="text-[#24151a]/25"
//             />

//           </button>


//           {/* HELP */}

//           <button
//             type="button"
//             className="group flex h-[58px] w-full items-center gap-3 px-4 text-left hover:bg-[#fffaf2]"
//           >

//             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fff0df]">
//               <CircleHelp
//                 size={15}
//                 className="text-[#741337]"
//               />
//             </div>

//             <div className="flex-1">

//               <p className="text-xs font-medium text-[#24151a]">
//                 Help & Support
//               </p>

//               <p className="text-[9px] text-[#24151a]/40">
//                 Need help with RaasMitra?
//               </p>

//             </div>

//             <ChevronRight
//               size={17}
//               className="text-[#24151a]/25"
//             />

//           </button>

//         </div>


//         {/* ================= LOGOUT ================= */}

//         <button
//           type="button"
//           className="mt-3 flex h-[48px] shrink-0 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white text-xs font-semibold text-[#b3263e] shadow-sm hover:bg-red-50"
//         >

//           <LogOut size={15} />

//           Logout

//         </button>


//         {/* ================= FOOTER ================= */}

//         <p className="mt-auto shrink-0 pb-1 pt-2 text-center text-[9px] text-[#24151a]/30">
//           Made for the Garba community ✨
//         </p>

//       </div>

//     </main>
//   );
// }