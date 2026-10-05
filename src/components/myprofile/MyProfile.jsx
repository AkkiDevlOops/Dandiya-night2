"use client";

import React, { useEffect, useRef, useState } from "react";
import Navbar from '@/components/Navbar'
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
/* =========================================================
   INTERESTS
========================================================= */

const INTERESTS = [
  "Music",
  "Movies",
  "TV",
  "Books",
  "Travel",
  "Food",
  "Sports",
  "Gaming",
  "Photography",
  "Art",
  "Fitness",
  "Cooking",
  "Dancing",
  "Hiking",
  "Pets",
  "Fashion",
  "Technology",
  "Business",
  "Cars",
  "Nature",
  "Nightlife",
  "Coffee",
  "Volunteering",
  "Reading",
  "Writing",
  "Cricket",
  "Football",
  "Badminton",
  "Basketball",
  "Trekking",
  "Road Trips",
  "Beaches",
  "Mountains",
  "Anime",
  "Podcasts",
  "Memes",
  "Startups",
  "Coding",
  "Design",
  "Content Creation",
  "Fitness Training",
  "Yoga",
  "Meditation",
  "Dance",
  "Fashion Design",
  "Concerts",
  "Festivals",
  "Garba",
  "Dandiya",
];

/* =========================================================
   PROMPT TYPES
========================================================= */

const PROMPT_TYPES = [
  {
    value: "text",
    label: "Text",
  },
  {
    value: "voice",
    label: "Voice",
  },
  {
    value: "video",
    label: "Video",
  },
  {
    value: "poll",
    label: "Poll",
  },
];

/* =========================================================
   DEFAULT PROMPT
========================================================= */

const createEmptyPrompt = () => ({
  question: "",
  answer: "",
  type: "text",
});

/* =========================================================
   HELPERS
========================================================= */

const normalizeProfile = (profile) => {
  if (!profile) return null;

  return {
    username: profile.username || "",
    branch: profile.branch || "",
    semester: profile.semester || "",
    college: profile.college || "",
    gender: profile.gender || "",

    dateOfBirth: profile.dateOfBirth
      ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
      : "",

    intro: profile.intro || "",

    interests: Array.isArray(profile.interests)
      ? profile.interests
      : [],

    prompts: Array.isArray(profile.prompts)
      ? profile.prompts.map((prompt) => ({
          _id: prompt._id,
          question: prompt.question || "",
          answer: prompt.answer || "",
          type: ["text", "voice", "video", "poll"].includes(prompt.type)
            ? prompt.type
            : "text",
        }))
      : [],

    images: Array.isArray(profile.images)
      ? profile.images
      : [],
  };
};

/* =========================================================
   MAIN PAGE
========================================================= */

export default function MyProfilePage() {
  /* -------------------------------------------------------
     PROFILE / ACCOUNT DATA
  ------------------------------------------------------- */

  const [user, setUser] = useState({
    username: "",
    branch: "",
    semester: "",
    college: "",
    gender: "",
  });

  /* -------------------------------------------------------
     EDITABLE PROFILE STATE
  ------------------------------------------------------- */

  const [profileData, setProfileData] = useState({
    dateOfBirth: "",
    intro: "",
    interests: [],
    prompts: [],
    images: [],
  });

  /* -------------------------------------------------------
     UI STATES
  ------------------------------------------------------- */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showMoreInterests, setShowMoreInterests] =
    useState(false);

  const [activePhotoIndex, setActivePhotoIndex] =
    useState(null);

  const fileInputRef = useRef(null);
  const router = useRouter();
  /* =======================================================
     GET PROFILE
  ======================================================= */

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/myprofile", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();
      console.log(data);
      if (!res.ok) {
        throw new Error(
          data.error || "Failed to load profile."
        );
      }

      const profile =
        data.user ||
        data.profile ||
        data.users;

      if (!profile) {
        throw new Error("Profile data not found.");
      }

      const normalized = normalizeProfile(profile);

      /* -----------------------------------------------
         LOCKED USER INFORMATION
      ------------------------------------------------ */

      setUser({
        username: normalized.username,
        branch: normalized.branch,
        semester: normalized.semester,
        college: normalized.college,
        gender: normalized.gender,
      });

      /* -----------------------------------------------
         EDITABLE PROFILE INFORMATION
      ------------------------------------------------ */

      setProfileData({
        dateOfBirth: normalized.dateOfBirth,
        intro: normalized.intro,
        interests: normalized.interests,
        prompts: normalized.prompts,
        images: normalized.images,
      });
    } catch (err) {
      console.error("Get profile error:", err);

      setError(
        err.message || "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     GENERIC STATE UPDATE
  ======================================================= */

  const updateProfileState = (updates) => {
    setProfileData((prev) => ({
      ...prev,
      ...updates,
    }));

    // Clear old messages when user starts editing
    setSuccess("");
    setError("");
  };

  /* =======================================================
     DATE OF BIRTH
  ======================================================= */

  const handleDateChange = (value) => {
    updateProfileState({
      dateOfBirth: value,
    });
  };

  /* =======================================================
     INTRO
  ======================================================= */

  const handleIntroChange = (value) => {
    if (value.length > 500) return;

    updateProfileState({
      intro: value,
    });
  };

  /* =======================================================
     INTERESTS
  ======================================================= */

  const toggleInterest = (interest) => {
    setProfileData((prev) => {
      const exists = prev.interests.includes(interest);

      const updatedInterests = exists
        ? prev.interests.filter(
            (item) => item !== interest
          )
        : [...prev.interests, interest];

      return {
        ...prev,
        interests: updatedInterests,
      };
    });

    setSuccess("");
    setError("");
  };

  const clearAllInterests = () => {
    updateProfileState({
      interests: [],
    });
  };

  const visibleInterests = showMoreInterests
    ? INTERESTS
    : INTERESTS.slice(0, 16);

  /* =======================================================
     PROMPTS
  ======================================================= */

  const addPrompt = () => {
    if (profileData.prompts.length >= 6) {
      return;
    }

    updateProfileState({
      prompts: [
        ...profileData.prompts,
        createEmptyPrompt(),
      ],
    });
  };

  const updatePrompt = (
    index,
    field,
    value
  ) => {
    setProfileData((prev) => {
      const prompts = [...prev.prompts];

      prompts[index] = {
        ...prompts[index],
        [field]: value,
      };

      return {
        ...prev,
        prompts,
      };
    });

    setSuccess("");
    setError("");
  };

  const removePrompt = (index) => {
    setProfileData((prev) => ({
      ...prev,
      prompts: prev.prompts.filter(
        (_, i) => i !== index
      ),
    }));

    setSuccess("");
    setError("");
  };

  /* =======================================================
     IMAGE HANDLING
     
     NOTE:
     This stores image as base64 in React state.
     Your backend can later receive it with Update Profile.
  ======================================================= */

  const openImagePicker = (index) => {
    setActivePhotoIndex(index);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result;

      setProfileData((prev) => {
        const images = [...prev.images];

        images[activePhotoIndex] = imageData;

        return {
          ...prev,
          images,
        };
      });

      setSuccess("");
      setError("");
    };

    reader.onerror = () => {
      setError("Failed to read image.");
    };

    reader.readAsDataURL(file);
  };

  const removeImage = (index) => {
    setProfileData((prev) => {
      const images = [...prev.images];

      images.splice(index, 1);

      return {
        ...prev,
        images,
      };
    });

    setSuccess("");
    setError("");
  };

  /* =======================================================
     UPDATE PROFILE
     
     THIS IS THE ONLY PLACE WHERE PROFILE DATA IS SENT
     TO THE BACKEND.
  ======================================================= */

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /* -----------------------------------------------
         CLEAN PROMPTS BEFORE SENDING
      ------------------------------------------------ */

      const cleanedPrompts =
        profileData.prompts
          .slice(0, 6)
          .map((prompt) => ({
            ...(prompt._id
              ? { _id: prompt._id }
              : {}),
            question:
              String(
                prompt.question || ""
              ).trim(),

            answer:
              String(
                prompt.answer || ""
              ).trim(),

            type: [
              "text",
              "voice",
              "video",
              "poll",
            ].includes(prompt.type)
              ? prompt.type
              : "text",
          }))
          .filter(
            (prompt) =>
              prompt.question ||
              prompt.answer
          );

      /* -----------------------------------------------
         PAYLOAD
         
         Username / branch / semester / college are
         intentionally NOT included.
      ------------------------------------------------ */

      const payload = {
        dateOfBirth:
          profileData.dateOfBirth || null,

        intro:
          profileData.intro.trim(),

        interests:
          profileData.interests,

        prompts:
          cleanedPrompts,

        images:
          profileData.images,
      };

      console.log(
        "Updating profile:",
        payload
      );

      const res = await fetch(
        "/api/updateprofile",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to update profile."
        );
      }

      /* -----------------------------------------------
         UPDATE STATE WITH BACKEND RESPONSE
      ------------------------------------------------ */

      const updatedProfile =
        data.user ||
        data.profile ||
        data.users;

      if (updatedProfile) {
        const normalized =
          normalizeProfile(
            updatedProfile
          );

        setUser({
          username:
            normalized.username,

          branch:
            normalized.branch,

          semester:
            normalized.semester,

          college:
            normalized.college,

          gender:
            normalized.gender,
        });

        setProfileData({
          dateOfBirth:
            normalized.dateOfBirth,

          intro:
            normalized.intro,

          interests:
            normalized.interests,

          prompts:
            normalized.prompts,

          images:
            normalized.images,
        });
      } else {
        /* ---------------------------------------------
           If backend doesn't return profile,
           keep our current state but normalize prompts.
        --------------------------------------------- */

        setProfileData((prev) => ({
          ...prev,
          prompts: cleanedPrompts,
        }));
      }

      setSuccess(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Update profile error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong while updating your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      setError("");

      const res = await fetch(
        "/api/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Logout failed."
        );
      }

      window.location.href = "/login";
    } catch (err) {
      console.error(
        "Logout error:",
        err
      );

      setError(
        err.message ||
          "Unable to logout."
      );

      setLoggingOut(false);
    }
  };

  /* =======================================================
     AGE CALCULATOR
  ======================================================= */

  const calculateAge = (dob) => {
    if (!dob) return null;

    const birthDate =
      new Date(dob);

    if (Number.isNaN(
      birthDate.getTime()
    )) {
      return null;
    }

    const today =
      new Date();

    let age =
      today.getFullYear() -
      birthDate.getFullYear();

    const monthDifference =
      today.getMonth() -
      birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 &&
        today.getDate() <
          birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const age = calculateAge(
    profileData.dateOfBirth
  );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen inset-0 z-60 fixed bg-[#fffaf2] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#741337]/20 border-t-[#741337]" />

          <p className="text-sm text-[#741337]/60">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */
// text-[#741337]
  return (
    <main className="min-h-screen inset-0 z-50 fixed overflow-y-auto  [&::-webkit-scrollbar]:hidden px-4 py-8 text-white sm:px-6 lg:px-8">
      
      <div className="mx-auto max-w-2xl">

        {/* =================================================
            HEADER
        ================================================= */}
        
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-red-400">
            Your profile
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Edit Profile
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-red-400">
            {/* Make your profile feel more like you.
            Changes will only be saved when you
            press Update Profile. */}
          </p>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-5 rounded-2xl  border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* =================================================
            PROFILE CARD
        ================================================= */}

        <section className="rounded-[28px] border border-[#741337]/8 bg-white text-[#741337] p-5 shadow-[0_10px_40px_rgba(116,19,55,0.06)] sm:p-7">
          <div className="flex "><div><button onClick={()=>router.push("/testroute")}><ArrowLeft/></button></div><div className="mx-2"><h1><a href="/testroute">Get Back to explore Page</a></h1></div></div>
          {/* ===============================================
              PHOTOS
          =============================================== */}

          <ProfileSection 
          
            number="01"
            title="Photos"
            description="Choose the photos people will see on your profile."
          >

            <div className="grid grid-cols-3  gap-3 sm:grid-cols-6">

              {Array.from({
                length: 6,
              }).map((_, index) => {
                const image =
                  profileData.images[
                    index
                  ];

                return (
                  <div
                    key={index}
                    className="relative aspect-[3/4]"
                  >
                    {image ? (
                      <div className="group relative h-full w-full overflow-hidden rounded-2xl bg-[#f7efe8]">

                        <img
                          src={image}
                          alt={`Profile photo ${
                            index + 1
                          }`}
                          className="h-full w-full object-cover"
                        />

                        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100">
                          <div className="mb-2 flex gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                openImagePicker(
                                  index
                                )
                              }
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#741337] "
                            >
                              Change
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeImage(
                                  index
                                )
                              }
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          openImagePicker(
                            index
                          )
                        }
                        className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#741337]/15 bg-[#fffaf2] text-[#741337]/50 transition hover:border-[#741337]/35 hover:bg-[#fdf3e9]"
                      >
                        <span className="text-2xl">
                          +
                        </span>

                        <span className="mt-1 text-[11px]">
                          Add
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}

            </div>

            <p className="mt-3 text-xs text-[#741337]/40">
              Maximum 5MB per image.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </ProfileSection>

          {/* ===============================================
              BASIC INFORMATION
          =============================================== */}

          <ProfileSection
            number="02"
            title="Basic Information"
            description="Some account information is fixed and cannot be edited here."
          >

            <div className="grid gap-4 sm:grid-cols-2">

              {/* Username */}

              <LockedField
                label="Username"
                value={
                  user.username
                }
              />

              {/* Branch */}

              <LockedField
                label="Branch"
                value={
                  user.branch
                }
              />

              {/* Semester */}

              <LockedField
                label="Year / Semester"
                value={
                  user.semester
                }
              />

              {/* College */}

              <LockedField
                label="College"
                value={
                  user.college
                }
              />

            </div>
          </ProfileSection>

          {/* ===============================================
              AGE / DOB
          =============================================== */}

          <ProfileSection
            number="03"
            title="Age"
            description="Your date of birth is used to calculate your age."
          >

            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Date of Birth
                </label>

                <input
                  type="date"
                  value={
                    profileData.dateOfBirth
                  }
                  onChange={(e) =>
                    handleDateChange(
                      e.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-[#741337]/10 bg-[#fffaf2] px-4 py-3 text-sm outline-none transition focus:border-[#741337]/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Age
                </label>

                <div className="flex h-[46px] items-center rounded-2xl border border-[#741337]/10 bg-[#f7efe8] px-4 text-sm">
                  {age !== null
                    ? `${age} years`
                    : "Select your date of birth"}
                </div>
              </div>

            </div>
          </ProfileSection>

          {/* ===============================================
              INTRO
          =============================================== */}

          <ProfileSection
            number="04"
            title="About You"
            description="Give people a small idea of who you are."
          >

            <div>
              <label className="mb-2 block text-sm font-medium">
                Intro
              </label>

              <textarea
                value={
                  profileData.intro
                }
                onChange={(e) =>
                  handleIntroChange(
                    e.target.value
                  )
                }
                maxLength={500}
                rows={5}
                placeholder="Tell people something about yourself..."
                className="w-full resize-none rounded-2xl border border-[#741337]/10 bg-[#fffaf2] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#741337]/30 focus:border-[#741337]/30"
              />

              <div className="mt-2 text-right text-xs text-[#741337]/35">
                {
                  profileData.intro
                    .length
                }
                /500
              </div>
            </div>
          </ProfileSection>

          {/* ===============================================
              INTERESTS
          =============================================== */}

          <ProfileSection
            number="05"
            title="Interests & Personality"
            description="Tap interests to select or remove them."
          >

            <div className="flex items-center justify-between gap-3">

              <p className="text-xs text-[#741337]/45">
                {
                  profileData.interests
                    .length
                }{" "}
                selected
              </p>

              {profileData.interests
                .length > 0 && (
                <button
                  type="button"
                  onClick={
                    clearAllInterests
                  }
                  className="text-xs font-medium text-[#741337]/55 underline underline-offset-4"
                >
                  Clear all
                </button>
              )}

            </div>

            <div className="mt-4 flex flex-wrap gap-2">

              {visibleInterests.map(
                (interest) => {
                  const selected =
                    profileData.interests.includes(
                      interest
                    );

                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() =>
                        toggleInterest(
                          interest
                        )
                      }
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        selected
                          ? "border-[#741337] bg-[#741337] text-white shadow-sm"
                          : "border-[#741337]/8 bg-[#fffaf2] text-[#741337]/55 hover:border-[#741337]/20 hover:text-[#741337]"
                      }`}
                    >
                      {interest}
                    </button>
                  );
                }
              )}

            </div>

            <button
              type="button"
              onClick={() =>
                setShowMoreInterests(
                  (prev) => !prev
                )
              }
              className="mt-5 text-sm font-semibold underline underline-offset-4"
            >
              {showMoreInterests
                ? "Show less"
                : "More interests"}
            </button>

          </ProfileSection>

          {/* ===============================================
              PROMPTS
          =============================================== */}

          <ProfileSection
            number="06"
            title="Prompts"
            description="Add up to 6 prompts to show more personality."
          >

            <div className="space-y-5">

              {profileData.prompts.map(
                (prompt, index) => (
                  <PromptCard
                    key={
                      prompt._id ||
                      index
                    }
                    prompt={prompt}
                    index={index}
                    onChange={
                      updatePrompt
                    }
                    onRemove={
                      removePrompt
                    }
                  />
                )
              )}

            </div>

            {profileData.prompts
              .length < 6 && (
              <button
                type="button"
                onClick={addPrompt}
                className="mt-5 w-full rounded-2xl border border-dashed border-[#741337]/15 bg-[#fffaf2] py-4 text-sm font-semibold transition hover:border-[#741337]/30 hover:bg-[#fdf3e9]"
              >
                + Add another prompt
              </button>
            )}

            <p className="mt-3 text-xs text-[#741337]/40">
              {
                profileData.prompts
                  .length
              }{" "}
              / 6 prompts
            </p>

          </ProfileSection>

          {/* ===============================================
              UPDATE + LOGOUT
          =============================================== */}

          <div className="mt-8 border-t border-[#741337]/8 pt-7">

            <button
              type="button"
              onClick={
                handleUpdateProfile
              }
              disabled={
                saving ||
                loggingOut
              }
              className="w-full rounded-full bg-[#741337] py-4 text-sm font-semibold text-white shadow-[0_8px_25px_rgba(116,19,55,0.18)] transition hover:bg-[#62102e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Updating Profile..."
                : "Update Profile"}
            </button>

            <button
              type="button"
              onClick={
                handleLogout
              }
              disabled={
                saving ||
                loggingOut
              }
              className="mt-4 w-full rounded-full border border-red-200 bg-white py-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>

          </div>

        </section>

      </div>
    </main>
  );
}

/* =========================================================
   PROFILE SECTION
========================================================= */

function ProfileSection({
  number,
  title,
  description,
  children,
}) {
  return (
    <section className="border-b border-[#741337]/8 py-7 first:pt-0 last:border-b-0">

      <div className="mb-5 flex gap-4">

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#741337]/8 text-xs font-semibold">
          {number}
        </div>

        <div>
          <h2 className="text-lg font-semibold">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm leading-5 text-[#741337]/45">
              {description}
            </p>
          )}
        </div>

      </div>

      {children}

    </section>
  );
}

/* =========================================================
   LOCKED FIELD
========================================================= */

function LockedField({
  label,
  value,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <div className="flex min-h-[46px] items-center justify-between rounded-2xl border border-[#741337]/8 bg-[#f7efe8] px-4">

        <span className="text-sm text-[#741337]/65">
          {value || "—"}
        </span>

        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#741337]/30">
          Locked
        </span>

      </div>
    </div>
  );
}

/* =========================================================
   PROMPT CARD
========================================================= */

function PromptCard({
  prompt,
  index,
  onChange,
  onRemove,
}) {
  return (
    <div className="rounded-3xl border border-[#741337]/8 bg-[#fffaf2] p-4 sm:p-5">

      {/* HEADER */}

      <div className="mb-4 flex items-center justify-between">

        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#741337]/40">
          Prompt {index + 1}
        </span>

        <button
          type="button"
          onClick={() =>
            onRemove(index)
          }
          className="text-xs font-medium text-red-500"
        >
          Remove
        </button>

      </div>

      {/* QUESTION */}

      <div>
        <label className="mb-2 block text-sm font-medium">
          Question
        </label>

        <input
          type="text"
          value={
            prompt.question
          }
          onChange={(e) =>
            onChange(
              index,
              "question",
              e.target.value
            )
          }
          placeholder="e.g. My ideal Sunday is..."
          className="w-full rounded-2xl border border-[#741337]/10 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#741337]/25 focus:border-[#741337]/30"
        />
      </div>

      {/* TYPE */}

      <div className="mt-4">

        <label className="mb-2 block text-sm font-medium">
          Response type
        </label>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

          {PROMPT_TYPES.map(
            (type) => {
              const selected =
                prompt.type ===
                type.value;

              return (
                <button
                  key={
                    type.value
                  }
                  type="button"
                  onClick={() =>
                    onChange(
                      index,
                      "type",
                      type.value
                    )
                  }
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                    selected
                      ? "border-[#741337] bg-[#741337] text-white"
                      : "border-[#741337]/8 bg-white text-[#741337]/50 hover:border-[#741337]/20"
                  }`}
                >
                  {type.label}
                </button>
              );
            }
          )}

        </div>

      </div>

      {/* ANSWER */}

      <div className="mt-4">

        <label className="mb-2 block text-sm font-medium">
          Answer
        </label>

        {prompt.type ===
        "text" ? (
          <textarea
            value={
              prompt.answer
            }
            onChange={(e) =>
              onChange(
                index,
                "answer",
                e.target.value
              )
            }
            rows={4}
            placeholder="Write your answer..."
            className="w-full resize-none rounded-2xl border border-[#741337]/10 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#741337]/25 focus:border-[#741337]/30"
          />
        ) : prompt.type ===
          "voice" ? (
          <div className="rounded-2xl border border-dashed border-[#741337]/15 bg-white px-4 py-6 text-center">

            <div className="text-2xl">
              🎙️
            </div>

            <p className="mt-2 text-sm font-medium">
              Voice answer
            </p>

            <p className="mt-1 text-xs text-[#741337]/40">
              Voice upload can be connected
              to your media upload API.
            </p>

          </div>
        ) : prompt.type ===
          "video" ? (
          <div className="rounded-2xl border border-dashed border-[#741337]/15 bg-white px-4 py-6 text-center">

            <div className="text-2xl">
              🎥
            </div>

            <p className="mt-2 text-sm font-medium">
              Video answer
            </p>

            <p className="mt-1 text-xs text-[#741337]/40">
              Video upload can be connected
              to your media upload API.
            </p>

          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#741337]/15 bg-white px-4 py-6 text-center">

            <div className="text-2xl">
              📊
            </div>

            <p className="mt-2 text-sm font-medium">
              Poll
            </p>

            <p className="mt-1 text-xs text-[#741337]/40">
              Poll options can be added
              when the poll system is connected.
            </p>

          </div>
        )}

      </div>

    </div>
  );
}




// "use client";

// import {
//   ArrowLeft,
//   Camera,
//   ChevronRight,
//   Pencil,
//   Plus,
//   X,
// } from "lucide-react";

// import Background from "@/components/matchingpage/backgroundblur";
// import { useEffect, useState } from "react";

// export default function MyProfile() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   const [editing, setEditing] = useState(null);

//   const [username, setUsername] = useState("");
//   const [branch, setBranch] = useState("");
//   const [semester, setSemester] = useState("");
//   const [intro, setIntro] = useState("");

//   const [interests, setInterests] = useState([]);
//   const [prompts, setPrompts] = useState([]);

//   useEffect(() => {
//     getProfile();
//   }, []);

//   const getProfile = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const response = await fetch("/api/myprofile");

//       const data = await response.json();

//       if (!response.ok || !data.success) {
//         throw new Error(
//           data.error || "Could not load your profile."
//         );
//       }

//       const profile = data.users;

//       setUser(profile);

//       setUsername(profile?.username || "");
//       setBranch(profile?.branch || "");
//       setSemester(profile?.semester || "");
//       setIntro(profile?.intro || "");

//       setInterests(
//         Array.isArray(profile?.interests)
//           ? profile.interests
//           : []
//       );

//       setPrompts(
//         Array.isArray(profile?.prompts)
//           ? profile.prompts
//           : []
//       );
//     } catch (err) {
//       console.error(err);
//       setError(
//         err.message ||
//           "Could not connect to the profile server."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --------------------------------------------------
//   // UPDATE PROFILE
//   // --------------------------------------------------

//   const updateProfile = async (updates) => {
//     try {
//       setSaving(true);
//       setError("");

//       const response = await fetch(
//         "/api/updateprofile",
//         {
//           method: "PATCH",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(updates),
//         }
//       );

//       const data = await response.json();

//       if (!response.ok || !data.success) {
//         throw new Error(
//           data.error || "Could not update profile."
//         );
//       }

//       const updatedUser =
//         data.users || data.user || data.profile;

//       if (updatedUser) {
//         setUser(updatedUser);

//         setUsername(
//           updatedUser.username || ""
//         );

//         setBranch(
//           updatedUser.branch || ""
//         );

//         setSemester(
//           updatedUser.semester || ""
//         );

//         setIntro(
//           updatedUser.intro || ""
//         );

//         setInterests(
//           Array.isArray(updatedUser.interests)
//             ? updatedUser.interests
//             : []
//         );

//         setPrompts(
//           Array.isArray(updatedUser.prompts)
//             ? updatedUser.prompts
//             : []
//         );
//       } else {
//         await getProfile();
//       }

//       setEditing(null);
//     } catch (err) {
//       console.error(err);

//       setError(
//         err.message ||
//           "Could not update your profile."
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   // --------------------------------------------------
//   // SAVE BASIC PROFILE
//   // --------------------------------------------------

//   const saveBasicProfile = () => {
//     updateProfile({
//       username,
//       branch,
//       semester,
//       intro,
//     });
//   };

//   // --------------------------------------------------
//   // SAVE INTERESTS
//   // --------------------------------------------------

//   const saveInterests = () => {
//     updateProfile({
//       interests,
//     });
//   };

//   // --------------------------------------------------
//   // SAVE PROMPT
//   // --------------------------------------------------

//   const savePrompt = (index, question, answer) => {
//     const updatedPrompts = [...prompts];

//     updatedPrompts[index] = {
//       ...updatedPrompts[index],
//       question,
//       answer,
//     };

//     setPrompts(updatedPrompts);

//     updateProfile({
//       prompts: updatedPrompts,
//     });
//   };

//   // --------------------------------------------------
//   // REMOVE INTEREST
//   // --------------------------------------------------

//   const removeInterest = (interest) => {
//     const updated = interests.filter(
//       (item) => item !== interest
//     );

//     setInterests(updated);

//     updateProfile({
//       interests: updated,
//     });
//   };

//   if (loading) {
//     return (
//       <main className="h-dvh overflow-hidden bg-[#fffaf2]">
//         <div className="fixed inset-0 z-10">
//           <Background />
//         </div>

//         <div className="fixed inset-0 z-50 mx-auto flex h-full w-full max-w-[500px] items-center justify-center bg-white">
//           <p className="text-sm text-[#741337]">
//             Loading profile...
//           </p>
//         </div>
//       </main>
//     );
//   }

//   return (
//     <main className="h-dvh overflow-hidden bg-[#fffaf2]">
//       <div className="fixed inset-0 z-10">
//         <Background />
//       </div>

//       <div className="fixed inset-0 z-50 mx-auto flex h-full w-full max-w-[500px] flex-col bg-white">

//         {/* ================= HEADER ================= */}

//         <div className="flex shrink-0 items-center justify-between border-b border-[#741337]/10 px-4 py-3">

//           <a href="/testroute">
//             <button
//               type="button"
//               className="flex h-9 w-9 items-center justify-center rounded-full text-[#741337] hover:bg-[#fff0df]"
//             >
//               <ArrowLeft size={20} />
//             </button>
//           </a>

//           <h1 className="font-serif text-xl font-bold text-[#24151a]">
//             My Profile
//           </h1>

//           <div className="w-9" />

//         </div>

//         {/* ================= SCROLL AREA ================= */}

//         <div className="flex-1 overflow-y-auto px-4 pb-8">

//           {/* ================= ERROR ================= */}

//           {error && (
//             <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-center text-xs text-red-500">
//               {error}
//             </div>
//           )}

//           {/* ================= PHOTOS ================= */}

//           <section className="mt-5">

//             <div className="mb-2 flex items-center justify-between">

//               <div>
//                 <h2 className="font-serif text-lg font-bold text-[#741337]">
//                   Your Photos
//                 </h2>

//                 <p className="text-[10px] text-[#24151a]/45">
//                   Show your best moments
//                 </p>
//               </div>

//               <Camera
//                 size={18}
//                 className="text-[#741337]"
//               />

//             </div>

//             <div className="grid grid-cols-3 gap-2">

//               {Array.from({
//                 length: 6,
//               }).map((_, index) => {

//                 const photo =
//                   user?.images?.[index];

//                 return (
//                   <div
//                     key={index}
//                     className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-[#741337]/10 bg-[#fffaf2]"
//                   >

//                     {photo ? (
//                       <>
//                         <img
//                           src={photo}
//                           alt={`Profile ${index + 1}`}
//                           className="h-full w-full object-cover"
//                         />

//                         <button
//                           type="button"
//                           className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"
//                         >
//                           <Pencil size={12} />
//                         </button>
//                       </>
//                     ) : (
//                       <button
//                         type="button"
//                         className="flex h-full w-full flex-col items-center justify-center text-[#741337]/50"
//                       >
//                         <Plus size={23} />

//                         <span className="mt-1 text-[9px]">
//                           Add photo
//                         </span>
//                       </button>
//                     )}

//                   </div>
//                 );
//               })}

//             </div>

//           </section>

//           {/* ================= BASIC INFO ================= */}

//           <section className="mt-6">

//             <div className="mb-2 flex items-center justify-between">

//               <h2 className="font-serif text-lg font-bold text-[#741337]">
//                 About You
//               </h2>

//               <button
//                 type="button"
//                 onClick={() =>
//                   setEditing("basic")
//                 }
//                 className="flex items-center gap-1 text-xs font-semibold text-[#741337]"
//               >
//                 <Pencil size={13} />
//                 Edit
//               </button>

//             </div>

//             <div className="rounded-2xl border border-[#741337]/10 bg-white p-4 shadow-sm">

//               <h3 className="font-serif text-[23px] font-bold text-[#741337]">
//                 {username || "Your name"}
//               </h3>

//               <p className="mt-1 text-xs text-[#24151a]/55">
//                 {semester || "Semester"}

//                 <span className="mx-1.5 text-[#ed7137]">
//                   •
//                 </span>

//                 {branch || "Branch"}
//               </p>

//               {intro && (
//                 <div className="mt-3 rounded-xl bg-[#fffaf2] px-3 py-3">

//                   <p className="text-xs italic leading-5 text-[#24151a]/65">
//                     {intro}
//                   </p>

//                 </div>
//               )}

//             </div>

//           </section>

//           {/* ================= BASIC EDITOR ================= */}

//           {editing === "basic" && (
//             <div className="mt-3 rounded-2xl border border-[#741337]/10 bg-[#fffaf2] p-4">

//               <input
//                 value={username}
//                 onChange={(e) =>
//                   setUsername(e.target.value)
//                 }
//                 placeholder="Username"
//                 className="mb-2 w-full rounded-xl border border-[#741337]/10 bg-white px-3 py-3 text-sm outline-none focus:border-[#741337]"
//               />

//               <input
//                 value={semester}
//                 onChange={(e) =>
//                   setSemester(e.target.value)
//                 }
//                 placeholder="Semester"
//                 className="mb-2 w-full rounded-xl border border-[#741337]/10 bg-white px-3 py-3 text-sm outline-none focus:border-[#741337]"
//               />

//               <input
//                 value={branch}
//                 onChange={(e) =>
//                   setBranch(e.target.value)
//                 }
//                 placeholder="Branch"
//                 className="mb-2 w-full rounded-xl border border-[#741337]/10 bg-white px-3 py-3 text-sm outline-none focus:border-[#741337]"
//               />

//               <textarea
//                 value={intro}
//                 onChange={(e) =>
//                   setIntro(e.target.value)
//                 }
//                 placeholder="Tell people a little about yourself..."
//                 rows={3}
//                 className="w-full resize-none rounded-xl border border-[#741337]/10 bg-white px-3 py-3 text-sm outline-none focus:border-[#741337]"
//               />

//               <div className="mt-3 flex gap-2">

//                 <button
//                   type="button"
//                   onClick={() =>
//                     setEditing(null)
//                   }
//                   className="flex-1 rounded-xl border border-[#741337]/15 bg-white py-2.5 text-xs font-semibold text-[#741337]"
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="button"
//                   disabled={saving}
//                   onClick={saveBasicProfile}
//                   className="flex-1 rounded-xl bg-[#741337] py-2.5 text-xs font-semibold text-white disabled:opacity-50"
//                 >
//                   {saving
//                     ? "Saving..."
//                     : "Save"}
//                 </button>

//               </div>

//             </div>
//           )}

//           {/* ================= PROMPTS ================= */}

//           <section className="mt-7">

//             <div className="mb-2 flex items-center justify-between">

//               <div>
//                 <h2 className="font-serif text-lg font-bold text-[#741337]">
//                   Your Prompts
//                 </h2>

//                 <p className="text-[10px] text-[#24151a]/45">
//                   Let people know what makes you, you
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={() =>
//                   setEditing("newPrompt")
//                 }
//                 className="flex items-center gap-1 text-xs font-semibold text-[#741337]"
//               >
//                 <Plus size={14} />
//                 Add
//               </button>

//             </div>

//             <div className="space-y-3">

//               {prompts.length === 0 && (
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setEditing("newPrompt")
//                   }
//                   className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#741337]/20 bg-[#fffaf2] py-8 text-[#741337]"
//                 >
//                   <Plus size={24} />

//                   <span className="mt-2 text-xs font-semibold">
//                     Add your first prompt
//                   </span>
//                 </button>
//               )}

//               {prompts.map(
//                 (prompt, index) => (
//                   <PromptCard
//                     key={index}
//                     prompt={prompt}
//                     index={index}
//                     editing={editing}
//                     setEditing={setEditing}
//                     savePrompt={savePrompt}
//                     saving={saving}
//                   />
//                 )
//               )}

//             </div>

//           </section>

//           {/* ================= INTERESTS ================= */}

//           <section className="mt-7">

//             <div className="mb-2 flex items-center justify-between">

//               <div>
//                 <h2 className="font-serif text-lg font-bold text-[#741337]">
//                   Interests
//                 </h2>

//                 <p className="text-[10px] text-[#24151a]/45">
//                   Things you enjoy
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 onClick={() =>
//                   setEditing("interests")
//                 }
//                 className="flex items-center gap-1 text-xs font-semibold text-[#741337]"
//               >
//                 <Pencil size={13} />
//                 Edit
//               </button>

//             </div>

//             <div className="rounded-2xl border border-[#741337]/10 bg-white p-4 shadow-sm">

//               <div className="flex flex-wrap gap-2">

//                 {interests.length === 0 ? (
//                   <button
//                     type="button"
//                     onClick={() =>
//                       setEditing("interests")
//                     }
//                     className="flex items-center gap-1 rounded-full border border-dashed border-[#741337]/20 px-3 py-2 text-xs text-[#741337]"
//                   >
//                     <Plus size={13} />
//                     Add interests
//                   </button>
//                 ) : (
//                   interests.map(
//                     (interest, index) => (
//                       <span
//                         key={index}
//                         className="rounded-full bg-[#fff0df] px-3 py-2 text-xs font-medium text-[#741337]"
//                       >
//                         {interest}
//                       </span>
//                     )
//                   )
//                 )}

//               </div>

//             </div>

//           </section>

//           {/* ================= INTEREST EDITOR ================= */}

//           {editing === "interests" && (
//             <InterestEditor
//               interests={interests}
//               setInterests={setInterests}
//               saveInterests={saveInterests}
//               saving={saving}
//             />
//           )}

//           {/* ================= FOOTER ================= */}

//           <p className="pb-3 pt-8 text-center text-[9px] text-[#24151a]/30">
//             Made for the Garba community ✨
//           </p>

//         </div>
//       </div>
//     </main>
//   );
// }

// // ==================================================
// // PROMPT CARD
// // ==================================================

// function PromptCard({
//   prompt,
//   index,
//   editing,
//   setEditing,
//   savePrompt,
//   saving,
// }) {
//   const [question, setQuestion] =
//     useState(prompt?.question || "");

//   const [answer, setAnswer] =
//     useState(prompt?.answer || "");

//   const isEditing =
//     editing === `prompt-${index}`;

//   return (
//     <div className="rounded-2xl border border-[#741337]/10 bg-white p-4 shadow-sm">

//       {isEditing ? (
//         <>
//           <input
//             value={question}
//             onChange={(e) =>
//               setQuestion(e.target.value)
//             }
//             placeholder="Prompt question"
//             className="mb-2 w-full rounded-xl border border-[#741337]/10 bg-[#fffaf2] px-3 py-3 text-xs font-semibold outline-none focus:border-[#741337]"
//           />

//           <textarea
//             value={answer}
//             onChange={(e) =>
//               setAnswer(e.target.value)
//             }
//             placeholder="Your answer..."
//             rows={4}
//             className="w-full resize-none rounded-xl border border-[#741337]/10 bg-[#fffaf2] px-3 py-3 text-sm outline-none focus:border-[#741337]"
//           />

//           <div className="mt-3 flex gap-2">

//             <button
//               type="button"
//               onClick={() =>
//                 setEditing(null)
//               }
//               className="flex-1 rounded-xl border border-[#741337]/15 py-2.5 text-xs font-semibold text-[#741337]"
//             >
//               Cancel
//             </button>

//             <button
//               type="button"
//               disabled={saving}
//               onClick={() =>
//                 savePrompt(
//                   index,
//                   question,
//                   answer
//                 )
//               }
//               className="flex-1 rounded-xl bg-[#741337] py-2.5 text-xs font-semibold text-white disabled:opacity-50"
//             >
//               {saving
//                 ? "Saving..."
//                 : "Save"}
//             </button>

//           </div>
//         </>
//       ) : (
//         <>
//           <div className="flex items-start justify-between gap-3">

//             <div className="flex-1">

//               <p className="text-[11px] font-semibold text-[#741337]">
//                 {prompt?.question ||
//                   "Prompt"}
//               </p>

//               <p className="mt-2 text-sm leading-6 text-[#24151a]">
//                 {prompt?.answer ||
//                   "Add your answer"}
//               </p>

//             </div>

//             <button
//               type="button"
//               onClick={() =>
//                 setEditing(
//                   `prompt-${index}`
//                 )
//               }
//               className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff0df] text-[#741337]"
//             >
//               <Pencil size={13} />
//             </button>

//           </div>
//         </>
//       )}

//     </div>
//   );
// }

// // ==================================================
// // INTEREST EDITOR
// // ==================================================

// function InterestEditor({
//   interests,
//   setInterests,
//   saveInterests,
//   saving,
// }) {
//   const [value, setValue] =
//     useState("");

//   const addInterest = () => {
//     const cleanValue =
//       value.trim();

//     if (!cleanValue) return;

//     if (
//       interests.includes(
//         cleanValue
//       )
//     ) {
//       setValue("");
//       return;
//     }

//     setInterests([
//       ...interests,
//       cleanValue,
//     ]);

//     setValue("");
//   };

//   const removeInterest = (
//     interest
//   ) => {
//     setInterests(
//       interests.filter(
//         (item) =>
//           item !== interest
//       )
//     );
//   };

//   return (
//     <div className="mt-3 rounded-2xl border border-[#741337]/10 bg-[#fffaf2] p-4">

//       <div className="flex gap-2">

//         <input
//           value={value}
//           onChange={(e) =>
//             setValue(e.target.value)
//           }
//           onKeyDown={(e) => {
//             if (e.key === "Enter") {
//               e.preventDefault();
//               addInterest();
//             }
//           }}
//           placeholder="Add an interest"
//           className="flex-1 rounded-xl border border-[#741337]/10 bg-white px-3 py-3 text-xs outline-none focus:border-[#741337]"
//         />

//         <button
//           type="button"
//           onClick={addInterest}
//           className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#741337] text-white"
//         >
//           <Plus size={17} />
//         </button>

//       </div>

//       <div className="mt-3 flex flex-wrap gap-2">

//         {interests.map(
//           (interest, index) => (
//             <button
//               type="button"
//               key={index}
//               onClick={() =>
//                 removeInterest(
//                   interest
//                 )
//               }
//               className="flex items-center gap-1 rounded-full bg-[#fff0df] px-3 py-2 text-xs font-medium text-[#741337]"
//             >
//               {interest}

//               <X size={12} />
//             </button>
//           )
//         )}

//       </div>

//       <button
//         type="button"
//         disabled={saving}
//         onClick={saveInterests}
//         className="mt-4 w-full rounded-xl bg-[#741337] py-3 text-xs font-semibold text-white disabled:opacity-50"
//       >
//         {saving
//           ? "Saving..."
//           : "Save Interests"}
//       </button>

//     </div>
//   );
// }

