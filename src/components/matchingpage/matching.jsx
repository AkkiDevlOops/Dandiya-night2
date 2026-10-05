"use client";

import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";

import {
  FiX,
  FiHeart,
  FiChevronLeft,
  FiChevronRight,
  FiMoreHorizontal,
  FiCornerUpLeft,
  FiFlag,
  FiSlash,
  FiSend,
  FiMapPin,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiUser,
  FiInfo,
} from "react-icons/fi";

export default function RaasMitraProfile() {
  // =====================================================
  // STATE
  // =====================================================

  const [profiles, setProfiles] = useState([]);

  const [loading, setLoading] = useState(true);

  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);

  const [photoIndex, setPhotoIndex] = useState(0);

  const [showMenu, setShowMenu] = useState(false);

  const [showReport, setShowReport] = useState(false);

  const [showComment, setShowComment] = useState(false);

  const [comment, setComment] = useState("");

  const [lastSkipped, setLastSkipped] = useState(null);

  // What is being liked
  const [likeTarget, setLikeTarget] = useState({
    type: "profile",
    id: null,
    photo: null,
  });

  // =====================================================
  // CURRENT PROFILE
  // =====================================================

  const currentProfile = profiles[currentIndex];

  // =====================================================
  // CURRENT PHOTOS
  // =====================================================

  const photos = useMemo(() => {
    if (!currentProfile) {
      return [];
    }

    if (!Array.isArray(currentProfile.images)) {
      return [];
    }

    return currentProfile.images
      .filter(
        (image) =>
          typeof image === "string" &&
          image.trim() !== ""
      )
      .slice(0, 6);
  }, [currentProfile]);

  const currentImage =
    photos[photoIndex] || "/default-profile.jpg";

  // =====================================================
  // CALCULATE AGE
  // =====================================================

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) {
      return null;
    }

    const dob = new Date(dateOfBirth);

    if (Number.isNaN(dob.getTime())) {
      return null;
    }

    const today = new Date();

    let age =
      today.getFullYear() -
      dob.getFullYear();

    const monthDifference =
      today.getMonth() -
      dob.getMonth();

    if (
      monthDifference < 0 ||
      (
        monthDifference === 0 &&
        today.getDate() < dob.getDate()
      )
    ) {
      age--;
    }

    return age >= 0 ? age : null;
  };

  const age =
    currentProfile?.age ??
    calculateAge(
      currentProfile?.dateOfBirth
    );

  // =====================================================
  // GET PROFILES
  // =====================================================

  const getProfiles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/chatgptroute",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          cache: "no-store",

          body: JSON.stringify({
            action: "discover",
            limit: 10,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "DISCOVERY RESPONSE:",
        data
      );

      if (!response.ok || !data.success) {
        if (
          response.status === 401 ||
          data.redirect
        ) {
          window.location.href =
            data.url || "/login";

          return;
        }

        throw new Error(
          data.message ||
            data.error ||
            "Failed to load profiles."
        );
      }

      // =================================================
      // ONLY NEW SCHEMA PROFILES
      // =================================================

      const validProfiles =
        Array.isArray(data.users)
          ? data.users.filter((profile) => {
              const images =
                Array.isArray(profile.images)
                  ? profile.images.filter(Boolean)
                  : [];

              const prompts =
                Array.isArray(profile.prompts)
                  ? profile.prompts.filter(
                      (prompt) =>
                        prompt?.question &&
                        prompt?.answer
                    )
                  : [];

              return (
                images.length >= 3 &&
                images.length <= 6 &&
                prompts.length >= 3 &&
                prompts.length <= 6
              );
            })
          : [];

      setProfiles(validProfiles);

      setCurrentIndex(0);

      setPhotoIndex(0);

    } catch (err) {
      console.error(
        "DISCOVERY ERROR:",
        err
      );

      setError(
        err?.message ||
          "Could not load profiles."
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    getProfiles();
  }, []);

  // =====================================================
  // RESET CURRENT PROFILE UI
  // =====================================================

  const resetProfileUI = () => {
    setPhotoIndex(0);

    setShowMenu(false);

    setShowReport(false);

    setShowComment(false);

    setComment("");

    setLikeTarget({
      type: "profile",
      id: null,
      photo: null,
    });
  };

  // =====================================================
  // NEXT PROFILE
  // =====================================================

  const nextProfile = () => {
    resetProfileUI();

    setCurrentIndex(
      (current) => current + 1
    );
  };

  // =====================================================
  // REMOVE CURRENT PROFILE
  // =====================================================

  const removeCurrentProfile = () => {
    setProfiles((currentProfiles) =>
      currentProfiles.filter(
        (_, index) =>
          index !== currentIndex
      )
    );

    setPhotoIndex(0);
  };

  // =====================================================
  // SKIP PROFILE
  // =====================================================

  const skipProfile = async () => {
    if (
      !currentProfile ||
      processing
    ) {
      return;
    }

    try {
      setProcessing(true);

      // Save current profile for undo
      setLastSkipped({
        profile: currentProfile,
        index: currentIndex,
      });

      /*
       * If your skip backend route is different,
       * change this endpoint.
       */

      const response = await fetch(
        "/api/discoverFunctions/skipped",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            profileId:
              currentProfile._id,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (
        !response.ok ||
        data.success === false
      ) {
        throw new Error(
          data.message ||
            "Could not skip profile."
        );
      }

      removeCurrentProfile();

    } catch (err) {
      console.error(
        "SKIP ERROR:",
        err
      );

      /*
       * If the skip route doesn't exist yet,
       * don't destroy the frontend flow.
       *
       * You can remove this fallback after
       * your skip backend is ready.
       */

      removeCurrentProfile();

    } finally {
      setProcessing(false);
    }
  };

  // =====================================================
  // UNDO SKIP
  // =====================================================

  const undoSkip = async () => {
    if (
      !lastSkipped ||
      processing
    ) {
      return;
    }

    try {
      setProcessing(true);

      /*
       * If your undo backend route is different,
       * change this endpoint.
       */

      const response = await fetch(
        "/api/discoverFunctions/undo",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            profileId:
              lastSkipped.profile._id,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Could not undo skip."
        );
      }

      setProfiles(
        (currentProfiles) => {
          const updated = [
            ...currentProfiles,
          ];

          updated.splice(
            Math.min(
              lastSkipped.index,
              updated.length
            ),
            0,
            lastSkipped.profile
          );

          return updated;
        }
      );

      setCurrentIndex(
        lastSkipped.index
      );

      setPhotoIndex(0);

      setLastSkipped(null);

    } catch (err) {
      console.error(
        "UNDO ERROR:",
        err
      );

      alert(
        err?.message ||
          "Could not undo."
      );

    } finally {
      setProcessing(false);
    }
  };

  // =====================================================
  // LIKE PROFILE
  // =====================================================

  const likeProfile = () => {
    if (
      !currentProfile ||
      processing
    ) {
      return;
    }

    setLikeTarget({
      type: "profile",

      id: currentProfile._id,

      photo:
        photos[0] || null,
    });

    setShowComment(true);
  };

  // =====================================================
  // LIKE PHOTO
  // =====================================================

  const likePhoto = () => {
    if (
      !currentProfile ||
      processing
    ) {
      return;
    }

    const selectedPhoto =
      photos[photoIndex];

    if (!selectedPhoto) {
      return;
    }

    setLikeTarget({
      type: "photo",

      // Important:
      // targetId remains PROFILE ID
      // because your like backend identifies
      // the target profile using targetId.

      id: currentProfile._id,

      photo: selectedPhoto,
    });

    setShowComment(true);
  };

  // =====================================================
  // LIKE PROMPT
  // =====================================================

  const likePrompt = (prompt) => {
    if (
      !currentProfile ||
      processing ||
      !prompt
    ) {
      return;
    }

    setLikeTarget({
      type: "prompt",

      // targetId remains PROFILE ID
      id: currentProfile._id,

      photo: null,

      promptId:
        prompt._id || null,
    });

    setShowComment(true);
  };

  // =====================================================
  // SUBMIT LIKE
  // =====================================================

  const submitLike = async () => {
    if (
      !currentProfile ||
      processing
    ) {
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch(
        "/api/discoverFunctions/likes",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            action: "like",

            targetType:
              likeTarget.type,

            targetId:
              currentProfile._id,

            targetIdphoto:
              likeTarget.photo ||
              currentProfile.images?.[0] ||
              null,

            targetIdName:
              currentProfile.username,

            comment:
              comment.trim(),
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "LIKE RESPONSE:",
        data
      );

      if (
        data.message ===
        "You already Liked this profile"
      ) {
        setError(
          "You already liked this profile."
        );

        setTimeout(() => {
          setError("");
          nextProfile();
        }, 1500);

        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            data.error ||
            "Could not send like."
        );
      }

      // Close modal
      setShowComment(false);

      setComment("");

      // Move to next profile
      nextProfile();

    } catch (err) {
      console.error(
        "LIKE ERROR:",
        err
      );

      setError(
        err?.message ||
          "Could not send like."
      );

      setTimeout(() => {
        setError("");
      }, 3000);

    } finally {
      setProcessing(false);
    }
  };

  // =====================================================
  // BLOCK PROFILE
  // =====================================================

  const blockProfile = async () => {
    if (
      !currentProfile ||
      processing
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Block this profile? You won't see them again."
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch(
        "/api/discoverFunctions/blocked",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            profileId:
              currentProfile._id,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Could not block profile."
        );
      }

      setShowMenu(false);

      removeCurrentProfile();

    } catch (err) {
      console.error(
        "BLOCK ERROR:",
        err
      );

      alert(
        err?.message ||
          "Could not block profile."
      );

    } finally {
      setProcessing(false);
    }
  };

  // =====================================================
  // REPORT PROFILE
  // =====================================================

  const reportProfile = async (
    reason
  ) => {
    if (
      !currentProfile ||
      processing
    ) {
      return;
    }

    try {
      setProcessing(true);

      /*
       * Change this endpoint if your report
       * backend uses another route.
       */

      const response = await fetch(
        "/api/discoverFunctions/reported",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            profileId:
              currentProfile._id,

            reason,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Could not report profile."
        );
      }

      setShowReport(false);

      setShowMenu(false);

      removeCurrentProfile();

      setError(
        "Thank you. This profile has been reported."
      );

      setTimeout(() => {
        setError("");
      }, 2500);

    } catch (err) {
      console.error(
        "REPORT ERROR:",
        err
      );

      alert(
        err?.message ||
          "Could not report profile."
      );

    } finally {
      setProcessing(false);
    }
  };

  // =====================================================
  // PHOTO NAVIGATION
  // =====================================================

  const nextPhoto = () => {
    if (photos.length <= 1) {
      return;
    }

    setPhotoIndex(
      (current) =>
        (current + 1) %
        photos.length
    );
  };

  const previousPhoto = () => {
    if (photos.length <= 1) {
      return;
    }

    setPhotoIndex(
      (current) =>
        (current - 1 + photos.length) %
        photos.length
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#4a1525]/20 border-t-[#4a1525] rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-gray-600">
            Finding people for you...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error && !currentProfile) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">

          <div className="text-5xl mb-4">
            💜
          </div>

          <h2 className="text-xl font-bold text-[#4a1525]">
            {error}
          </h2>

          <button
            onClick={getProfiles}
            className="mt-5 px-6 py-3 rounded-full bg-[#4a1525] text-white font-semibold"
          >
            Try Again
          </button>

        </div>
      </div>
    );
  }

  // =====================================================
  // NO MORE PROFILES
  // =====================================================

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col">

        <div className="flex-1 flex items-center justify-center px-6 pb-24">

          <div className="text-center max-w-sm">

            <div className="text-6xl mb-5">
              💜
            </div>

            <h2 className="text-2xl font-extrabold text-[#4a1525]">
              You've reached the end
            </h2>

            <p className="mt-3 text-gray-600">
              You've seen everyone available
              right now.
            </p>

            <button
              onClick={getProfiles}
              className="mt-6 px-7 py-3 rounded-full bg-[#4a1525] text-white font-semibold"
            >
              Refresh
            </button>

          </div>

        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div className="max-w-md mx-auto">
            <Navbar />
          </div>
        </div>

      </div>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <div className="min-h-screen bg-[#fdfbf7]">

      <div className="max-w-md mx-auto min-h-screen bg-[#fdfbf7]">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="sticky top-0 z-30 bg-[#fdfbf7]/95 backdrop-blur px-5 pt-6 pb-4">

          <div className="flex items-center justify-between">

            <div>
              <h1 className="text-2xl font-black text-[#4a1525]">
                Raas Mitra
              </h1>

              <p className="text-xs text-gray-500 mt-1">
                Discover people
              </p>
            </div>

            <div className="relative">

              <button
                onClick={() =>
                  setShowMenu(
                    (value) => !value
                  )
                }
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5"
              >
                <FiMoreHorizontal
                  size={25}
                />
              </button>

            </div>

          </div>

        </div>

        {/* =================================================
            PROFILE
        ================================================= */}

        <div className="px-4 pb-32">

          <div
            className="bg-white rounded-[28px] overflow-hidden shadow-lg border border-gray-100"
          >

            {/* =============================================
                NAME
            ============================================= */}

            <div className="px-5 pt-5 pb-4 flex items-start justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <h2 className="text-3xl font-black text-gray-900">
                    {currentProfile.username}
                  </h2>

                  {age && (
                    <span className="text-2xl text-gray-500 font-medium">
                      {age}
                    </span>
                  )}

                </div>

                {currentProfile.intro && (
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                    {currentProfile.intro}
                  </p>
                )}

              </div>

              <button
                onClick={() =>
                  setShowMenu(
                    (value) => !value
                  )
                }
                className="shrink-0 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <FiMoreHorizontal />
              </button>

            </div>

            {/* =============================================
                MAIN PHOTO
            ============================================= */}

            <div className="relative">

              <img
                src={currentImage}
                alt={
                  currentProfile.username ||
                  "Profile"
                }
                className="w-full h-[58vh] object-cover"
              />

              {/* PHOTO PROGRESS */}

              {photos.length > 1 && (
                <div className="absolute top-4 left-4 right-4 flex gap-1">

                  {photos.map(
                    (_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full ${
                          index ===
                          photoIndex
                            ? "bg-white"
                            : "bg-white/40"
                        }`}
                      />
                    )
                  )}

                </div>
              )}

              {/* PREVIOUS */}

              {photos.length > 1 && (
                <button
                  onClick={previousPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center"
                >
                  <FiChevronLeft
                    size={24}
                  />
                </button>
              )}

              {/* NEXT */}

              {photos.length > 1 && (
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center"
                >
                  <FiChevronRight
                    size={24}
                  />
                </button>
              )}

              {/* LIKE PHOTO */}

              <button
                onClick={likePhoto}
                disabled={processing}
                className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
              >
                <FiHeart
                  size={28}
                  className="text-red-500"
                />
              </button>

            </div>

            {/* =============================================
                PHOTO COUNTER
            ============================================= */}

            <div className="px-5 pt-3">

              <p className="text-xs text-gray-400">
                {photoIndex + 1} /{" "}
                {photos.length}
                {" • "}
                Tap ❤️ to like this photo
              </p>

            </div>

            {/* =============================================
                BASIC INFORMATION
            ============================================= */}

            <div className="px-5 pt-6">

              <div className="grid grid-cols-2 gap-3">

                {/* AGE */}

                <div className="rounded-2xl bg-[#fdfbf7] p-4">

                  <div className="flex items-center gap-2 text-gray-400">
                    <FiCalendar size={15} />

                    <span className="text-xs">
                      Age
                    </span>
                  </div>

                  <p className="mt-1 font-bold text-gray-900">
                    {age || "—"}
                  </p>

                </div>

                {/* HEIGHT */}

                <div className="rounded-2xl bg-[#fdfbf7] p-4">

                  <div className="flex items-center gap-2 text-gray-400">
                    <FiUser size={15} />

                    <span className="text-xs">
                      Height
                    </span>
                  </div>

                  <p className="mt-1 font-bold text-gray-900">
                    {currentProfile.height
                      ? `${currentProfile.height} cm`
                      : "—"}
                  </p>

                </div>

                {/* BRANCH */}

                <div className="rounded-2xl bg-[#fdfbf7] p-4">

                  <div className="flex items-center gap-2 text-gray-400">
                    <FiBookOpen
                      size={15}
                    />

                    <span className="text-xs">
                      Branch
                    </span>
                  </div>

                  <p className="mt-1 font-bold text-gray-900">
                    {currentProfile.branch ||
                      "—"}
                  </p>

                </div>

                {/* SEMESTER */}

                <div className="rounded-2xl bg-[#fdfbf7] p-4">

                  <div className="flex items-center gap-2 text-gray-400">
                    <FiBriefcase
                      size={15}
                    />

                    <span className="text-xs">
                      Semester
                    </span>
                  </div>

                  <p className="mt-1 font-bold text-gray-900">
                    {currentProfile.semester ||
                      "—"}
                  </p>

                </div>

              </div>

              {/* COLLEGE */}

              <div className="mt-3 rounded-2xl bg-[#fdfbf7] p-4">

                <div className="flex items-center gap-2 text-gray-400">

                  <FiBookOpen
                    size={15}
                  />

                  <span className="text-xs">
                    College
                  </span>

                </div>

                <p className="mt-1 font-bold text-gray-900">
                  {currentProfile.college ||
                    "—"}
                </p>

              </div>

              {/* GENDER */}

              {currentProfile.gender && (
                <div className="mt-3 rounded-2xl bg-[#fdfbf7] p-4">

                  <div className="flex items-center gap-2 text-gray-400">

                    <FiUser size={15} />

                    <span className="text-xs">
                      Gender
                    </span>

                  </div>

                  <p className="mt-1 font-bold text-gray-900">
                    {currentProfile.gender}
                  </p>

                </div>
              )}

            </div>

            {/* =============================================
                INTERESTS
            ============================================= */}

            {Array.isArray(
              currentProfile.interests
            ) &&
              currentProfile.interests
                .length > 0 && (

                <div className="px-5 pt-7">

                  <div className="flex items-center gap-2 mb-3">

                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Interests
                    </h3>

                  </div>

                  <div className="flex flex-wrap gap-2">

                    {currentProfile.interests.map(
                      (interest, index) => (
                        <span
                          key={`${interest}-${index}`}
                          className="px-3 py-2 rounded-full bg-[#4a1525]/10 text-[#4a1525] text-sm font-medium"
                        >
                          {interest}
                        </span>
                      )
                    )}

                  </div>

                </div>
              )}

            {/* =============================================
                PROMPTS
            ============================================= */}

            <div className="px-5 pt-7">

              <div className="flex items-center justify-between mb-3">

                <div>

                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Get to know{" "}
                    {currentProfile.username}
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Tap ❤️ on something you like
                  </p>

                </div>

                <span className="text-xs text-gray-400">
                  {currentProfile.prompts?.length ||
                    0}{" "}
                  prompts
                </span>

              </div>

              <div className="space-y-4">

                {currentProfile.prompts?.map(
                  (prompt, index) => (
                    <button
                      key={
                        prompt._id ||
                        prompt.id ||
                        index
                      }
                      onClick={() =>
                        likePrompt(
                          prompt
                        )
                      }
                      disabled={processing}
                      className="w-full text-left border border-gray-200 rounded-2xl p-5 hover:border-[#4a1525]/40 hover:bg-[#fdfbf7] transition disabled:opacity-50"
                    >

                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                        {prompt.question}
                      </p>

                      <p className="text-lg font-semibold text-gray-900 leading-relaxed">
                        {prompt.answer}
                      </p>

                      <div className="mt-5 flex justify-end">

                        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">

                          <FiHeart
                            size={18}
                            className="text-red-400"
                          />

                        </div>

                      </div>

                    </button>
                  )
                )}

              </div>

            </div>

            {/* =============================================
                REMAINING PHOTOS
            ============================================= */}

            {photos
              .slice(1)
              .map((photo, index) => {

                const realIndex =
                  index + 1;

                return (
                  <div
                    key={`${photo}-${realIndex}`}
                    className="px-5 pt-7"
                  >

                    <div className="relative overflow-hidden rounded-2xl">

                      <img
                        src={photo}
                        alt={`${currentProfile.username} ${realIndex + 1}`}
                        className="w-full h-[55vh] object-cover"
                      />

                      {/* PHOTO NUMBER */}

                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/40 text-white text-xs">
                        {realIndex + 1} /{" "}
                        {photos.length}
                      </div>

                      {/* LIKE PHOTO */}

                      <button
                        onClick={() => {

                          setPhotoIndex(
                            realIndex
                          );

                          setLikeTarget({
                            type: "photo",

                            id: currentProfile._id,

                            photo,
                          });

                          setShowComment(
                            true
                          );
                        }}
                        disabled={processing}
                        className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center disabled:opacity-50"
                      >

                        <FiHeart
                          size={27}
                          className="text-red-500"
                        />

                      </button>

                    </div>

                  </div>
                );
              })}

            {/* =============================================
                PROFILE LIKE / SKIP
            ============================================= */}

            <div className="flex justify-center gap-5 px-5 py-8">

              {/* UNDO */}

              <button
                onClick={undoSkip}
                disabled={
                  !lastSkipped ||
                  processing
                }
                className="w-14 h-14 rounded-full border border-yellow-200 bg-yellow-50 flex items-center justify-center disabled:opacity-30"
              >
                <FiCornerUpLeft
                  size={24}
                  className="text-yellow-600"
                />
              </button>

              {/* SKIP */}

              <button
                onClick={skipProfile}
                disabled={processing}
                className="w-16 h-16 rounded-full bg-white border border-red-100 shadow-md flex items-center justify-center disabled:opacity-50"
              >
                <FiX
                  size={30}
                  className="text-red-500"
                />
              </button>

              {/* LIKE */}

              <button
                onClick={likeProfile}
                disabled={processing}
                className="w-16 h-16 rounded-full bg-[#4a1525] shadow-lg flex items-center justify-center disabled:opacity-50"
              >
                <FiHeart
                  size={30}
                  className="text-white"
                />
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* ===================================================
          MORE MENU
      =================================================== */}

      {showMenu && (
        <div className="fixed inset-0 z-50">

          <button
            className="absolute inset-0 bg-black/20"
            onClick={() =>
              setShowMenu(false)
            }
          />

          <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl p-5 shadow-2xl">

            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

            {/* BLOCK */}

            <button
              onClick={blockProfile}
              disabled={processing}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-left disabled:opacity-50"
            >

              <FiSlash
                size={22}
                className="text-gray-700"
              />

              <div>

                <p className="font-semibold">
                  Block
                </p>

                <p className="text-sm text-gray-500">
                  You won't see this profile again.
                </p>

              </div>

            </button>

            {/* REPORT */}

            <button
              onClick={() => {
                setShowMenu(false);
                setShowReport(true);
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-left"
            >

              <FiFlag
                size={22}
                className="text-red-500"
              />

              <div>

                <p className="font-semibold text-red-600">
                  Report
                </p>

                <p className="text-sm text-gray-500">
                  Report something inappropriate.
                </p>

              </div>

            </button>

          </div>

        </div>
      )}

      {/* ===================================================
          REPORT MODAL
      =================================================== */}

      {showReport && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">

          <div className="bg-white w-full max-w-md rounded-t-3xl p-6">

            <h2 className="text-xl font-bold">
              Report profile
            </h2>

            <p className="text-gray-500 text-sm mt-2 mb-5">
              Why are you reporting this profile?
            </p>

            {[
              "Fake profile",
              "Inappropriate content",
              "Harassment",
              "Spam",
              "Something else",
            ].map((reason) => (

              <button
                key={reason}
                onClick={() =>
                  reportProfile(reason)
                }
                disabled={processing}
                className="w-full text-left px-4 py-4 border-b hover:bg-gray-50 disabled:opacity-50"
              >
                {reason}
              </button>

            ))}

            <button
              onClick={() =>
                setShowReport(false)
              }
              className="w-full mt-4 py-3 rounded-full bg-gray-100 font-semibold"
            >
              Cancel
            </button>

          </div>

        </div>
      )}

      {/* ===================================================
          LIKE COMMENT MODAL
      =================================================== */}

      {showComment && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">

          <div className="bg-white w-full max-w-md rounded-t-3xl p-6">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  Send a Like
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Add a comment if you want to start the conversation.
                </p>

              </div>

              <div className="w-10 h-10 rounded-full bg-[#4a1525]/10 flex items-center justify-center">

                <FiHeart
                  className="text-[#4a1525]"
                />

              </div>

            </div>

            {/* LIKE TARGET */}

            <div className="mt-4 px-4 py-3 rounded-xl bg-[#fdfbf7]">

              <p className="text-xs uppercase tracking-wider font-bold text-gray-400">
                Liking
              </p>

              <p className="text-sm font-semibold text-[#4a1525] mt-1">

                {likeTarget.type ===
                  "profile" &&
                  "Their profile"}

                {likeTarget.type ===
                  "photo" &&
                  "Their photo"}

                {likeTarget.type ===
                  "prompt" &&
                  "Their prompt"}

              </p>

            </div>

            <textarea
              value={comment}
              onChange={(event) =>
                setComment(
                  event.target.value
                )
              }
              maxLength={500}
              placeholder="Say something nice..."
              className="w-full mt-5 h-28 border border-gray-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#4a1525]/20 resize-none"
            />

            <div className="flex justify-between mt-2">

              <span className="text-xs text-gray-400">
                Optional
              </span>

              <span className="text-xs text-gray-400">
                {comment.length}/500
              </span>

            </div>

            <div className="flex gap-3 mt-4">

              <button
                onClick={() => {
                  setShowComment(false);
                  setComment("");
                }}
                className="flex-1 py-3 rounded-full bg-gray-100 font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={submitLike}
                disabled={processing}
                className="flex-1 py-3 rounded-full bg-[#4a1525] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >

                <FiSend />

                {processing
                  ? "Sending..."
                  : "Send Like"}

              </button>

            </div>

          </div>

        </div>
      )}

      {/* ===================================================
          ERROR TOAST
      =================================================== */}

      {error && currentProfile && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md">

          <div className="bg-[#4a1525] text-white rounded-2xl px-4 py-3 shadow-xl text-sm font-medium text-center">
            {error}
          </div>

        </div>
      )}

      {/* ===================================================
          NAVBAR
      =================================================== */}

      <div className="fixed bottom-0 left-0 right-0 z-40">

        <div className="max-w-md mx-auto">

          <Navbar />

        </div>

      </div>

    </div>
  );
}



// "use client";

// import React, { useEffect, useState } from "react";
// import Navbar from "@/components/Navbar";
// import {
//   FiX,
//   FiHeart,
//   FiChevronLeft,
//   FiChevronRight,
//   FiMoreHorizontal,
//   FiCornerUpLeft,
//   FiFlag,
//   FiSlash,
//   FiSend,
// } from "react-icons/fi";

// export default function RaasMitraProfile() {
//   const [profiles, setProfiles] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [processing, setProcessing] = useState(false);
//   const [error, setError] = useState("");

//   // Current profile
//   const [currentIndex, setCurrentIndex] = useState(0);

//   // Current photo
//   const [photoIndex, setPhotoIndex] = useState(0);

//   // More menu
//   const [showMenu, setShowMenu] = useState(false);

//   // Report menu
//   const [showReport, setShowReport] = useState(false);

//   // Comment modal
//   const [showComment, setShowComment] = useState(false);
//   const [comment, setComment] = useState("");

//   // What is being liked
//   const [likeTarget, setLikeTarget] = useState({
//     type: "profile",
//     id: null,
//   });

//   // Last skipped profile for Undo
//   const [lastSkipped, setLastSkipped] = useState(null);

//   // -------------------------------------------------------
//   // Current profile
//   // -------------------------------------------------------

//   const currentProfile = profiles[currentIndex];

//   // -------------------------------------------------------
//   // Get profiles
//   // -------------------------------------------------------

//   const getProfiles = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       const response = await fetch("/api/chatgptroute", {
//         method: "POST",

//         headers: {
//           "Content-Type": "application/json",
//         },

//         body: JSON.stringify({
//           action: "discover",
//           limit: 10,
//         }),
//       });

//       const data = await response.json();
//       console.log(data);
       

//       if (!response.ok || !data.success) {
//          if (response.status === 401 || data.redirect) {
//         setTimeout(() => {
//           window.location.href = data.url; 
//       return;
//         }, 3000);
//         throw new Error(
//           data.message ||
//             data.error ||
//             "Failed to load profiles."
//         );
       
//       }
//       }

//       setProfiles(data.users || []);
//       setCurrentIndex(0);
//       setPhotoIndex(0);

      
      
    

//     } catch (error) {
//       console.error(error);

//       setError(
//         error.message ||
//           "Could not load profiles."
//       );

//     } finally {
//       setLoading(false);
//     }
//   };

//   // -------------------------------------------------------
//   // Initial load
//   // -------------------------------------------------------

//   useEffect(() => {
//     getProfiles();
//   }, []);

//   // -------------------------------------------------------
//   // Move to next profile
//   // -------------------------------------------------------

//   const nextProfile = () => {
//     setPhotoIndex(0);
//     setShowMenu(false);
//     setShowReport(false);
//     setShowComment(false);
//     setComment("");

//     setCurrentIndex((current) => current + 1);
//   };

//   // -------------------------------------------------------
//   // Remove current profile locally
//   // -------------------------------------------------------

//   const removeCurrentProfile = () => {
//     setProfiles((currentProfiles) => {
//       return currentProfiles.filter(
//         (_, index) =>
//           index !== currentIndex
//       );
//     });

//     setPhotoIndex(0);
//   };

//   // -------------------------------------------------------
//   // Skip profile
//   // -------------------------------------------------------

//   const skipProfile = async () => {
//     if (!currentProfile || processing) {
//       return;
//     }

//     try {
//       setProcessing(true);

//       const profileId =
//         currentProfile._id;

//       const response = await fetch(
//         "/api/",
//         {
//           method: "POST",

//           headers: {
//             "Content-Type": "application/json",
//           },

//           body: JSON.stringify({
//             action: "skip",
//             profileId,
//           }),
//         }
//       );

//       // const data =
//       //   await response.json();

//       // if (!response.ok || !data.success) {
//       //   throw new Error(
//       //     data.message ||
//       //       "Could not skip profile."
//       //   );
//       // }

//       // Save for undo
//       setLastSkipped({
//         profile: currentProfile,
//         index: currentIndex,
//       });

//       removeCurrentProfile();

//     } catch (error) {
//       console.error(error);

//       alert(
//         error.message ||
//           "Could not skip this profile."
//       );

//     } finally {
//       setProcessing(false);
//     }
//   };

//   // -------------------------------------------------------
//   // Undo skip
//   // -------------------------------------------------------

//   const undoSkip = async () => {
//     if (!lastSkipped || processing) {
//       return;
//     }

//     try {
//       setProcessing(true);

//       const response = await fetch(
//         "/api/",
//         {
//           method: "POST",

//           headers: {
//             "Content-Type": "application/json",
//           },

//           body: JSON.stringify({
//             action: "undo",
//             profileId:
//               lastSkipped.profile._id,
//           }),
//         }
//       );

//       const data =
//         await response.json();

//       if (!response.ok || !data.success) {
//         throw new Error(
//           data.message ||
//             "Could not undo skip."
//         );
//       }

//       setProfiles((currentProfiles) => {
//         const updated = [
//           ...currentProfiles,
//         ];

//         updated.splice(
//           Math.min(
//             lastSkipped.index,
//             updated.length
//           ),
//           0,
//           lastSkipped.profile
//         );

//         return updated;
//       });

//       setCurrentIndex(
//         Math.min(
//           lastSkipped.index,
//           profiles.length
//         )
//       );

//       setLastSkipped(null);

//     } catch (error) {
//       console.error(error);

//       alert(
//         error.message ||
//           "Could not undo."
//       );

//     } finally {
//       setProcessing(false);
//     }
//   };

//   // -------------------------------------------------------
//   // Like profile
//   // -------------------------------------------------------

//   const likeProfile = async (current) => {
//     if (!currentProfile || processing) {
//       return;
//     }
//     console.log(current)
//     setLikeTarget({
//       type: "profile",
//       id: current._id,
//     });

//     setShowComment(true);
//   };

//   // -------------------------------------------------------
//   // Like photo
//   // -------------------------------------------------------

//   const likePhoto = () => {
//     if (!currentProfile || processing) {
//       return;
//     }

//     const photos =
//       currentProfile.images || [];

//     if (!photos[photoIndex]) {
//       return;
//     }

//     setLikeTarget({
//       type: "photo",
//       id: String(currentProfile._id),
//     });

//     setShowComment(true);
//   };

//   // -------------------------------------------------------
//   // Like prompt
//   // -------------------------------------------------------

//   const likePrompt = () => {
//     if (!currentProfile || processing) {
//       return;
//     }

//     setLikeTarget({
//       type: "prompt",
//       id: "promt1",
//     });

//     setShowComment(true);
//   };

//   // -------------------------------------------------------
//   // Submit like
//   // -------------------------------------------------------

//   const submitLike = async (current) => {
//     if (!current || processing) {
//       return;
//     }
//     console.log(current);
//     try {
//       setProcessing(true);

//       const response = await fetch(
//         "/api/discoverFunctions/likes",
//         {
//           method: "POST",

//           headers: {
//             "Content-Type":
//               "application/json",
//           },

//           body: JSON.stringify({
//             action: "like",

//             targetType:
//               likeTarget.type,

//             targetId:
//               current._id,

//             targetIdphoto:current.images[0],
//             targetIdName: current.username,
//             comment:
//               comment.trim(),
//           }),
//         }
//       );

//       // const data = await response.json();
//         const data = await response.json();
//         console.log(data);
//        if( data.message === "You already Liked this profile"){
//         setError("You already Liked this profile");
//          setTimeout(() => {
//           nextProfile()
//           setError("");
//            return;
//           }, 3000);
          
         
//        }

//       if (!response.ok || !data.success) {
//         throw new Error(
//           data.message ||
//             "Could not send like."
//         );
//       }

//       setShowComment(false);
//       setComment("");

//       nextProfile();

//     } catch (error) {
      
      
//       console.error(error);
  
//   // 1. Set the error message to display the div
//   setError(error.message || "Could not send like.");

//   // 2. Hide the div automatically after 3 seconds
//   setTimeout(() => {
//     setError("");
//   }, 3000);

//     } finally {
//       setProcessing(false);
//     }
//   };

//   // -------------------------------------------------------
//   // Block
//   // -------------------------------------------------------

//  const blockProfile = async () => {
//   if (!currentProfile || processing) {
//     return;
//   }

//   const confirmed = window.confirm(
//     "Block this profile? You won't see them again."
//   );

//   if (!confirmed) {
//     return;
//   }

//   try {
//     setProcessing(true);

//     const response = await fetch("/api/discoverFunctions/blocked", {
//       method: "POST",

//       headers: {
//         "Content-Type": "application/json",
//       },

//       body: JSON.stringify({
//         profileId: currentProfile._id,
//       }),
//     });

//     const data = await response.json();

//     if (!response.ok || !data.success) {
//       throw new Error(
//         data.message || "Could not block profile."
//       );
//     }

//     console.log(data);

//     setShowMenu(false);

//     removeCurrentProfile();

//   } catch (error) {
//     console.error("BLOCK ERROR:", error);

//     alert(
//       error.message || "Could not block profile."
//     );

//   } finally {
//     setProcessing(false);
//   }
// };

//   // -------------------------------------------------------
//   // Report
//   // -------------------------------------------------------

//   const reportProfile = async (reason) => {
//     if (!currentProfile || processing) {
//       return;
//     }

//     try {
//       setProcessing(true);

//       const response = await fetch(
//         "/api/",
//         {
//           method: "POST",

//           headers: {
//             "Content-Type":
//               "application/json",
//           },

//           body: JSON.stringify({
//             action: "report",

//             profileId:
//               currentProfile._id,

//             reason,
//           }),
//         }
//       );

//       const data =
//         await response.json();

//       if (!response.ok || !data.success) {
//         throw new Error(
//           data.message ||
//             "Could not report profile."
//         );
//       }

//       setShowReport(false);
//       setShowMenu(false);

//       removeCurrentProfile();

//       alert(
//         "Thank you. This profile has been reported."
//       );

//     } catch (error) {
//       console.error(error);

//       alert(
//         error.message ||
//           "Could not report profile."
//       );

//     } finally {
//       setProcessing(false);
//     }
//   };

//   // -------------------------------------------------------
//   // Photo navigation
//   // -------------------------------------------------------

//   const nextPhoto = () => {
//     if (!currentProfile) {
//       return;
//     }

//     const photos =
//       currentProfile.images || [];

//     if (photos.length === 0) {
//       return;
//     }

//     setPhotoIndex(
//       (current) =>
//         (current + 1) %
//         photos.length
//     );
//   };

//   const previousPhoto = () => {
//     if (!currentProfile) {
//       return;
//     }

//     const photos =
//       currentProfile.images || [];

//     if (photos.length === 0) {
//       return;
//     }

//     setPhotoIndex(
//       (current) =>
//         (current - 1 + photos.length) %
//         photos.length
//     );
//   };

//   // -------------------------------------------------------
//   // Loading
//   // -------------------------------------------------------

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-10 h-10 border-4 border-[#4a1525]/20 border-t-[#4a1525] rounded-full animate-spin mx-auto" />

//           <p className="mt-4 text-gray-600">
//             Finding people for you...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // -------------------------------------------------------
//   // Error
//   // -------------------------------------------------------

//   if (error) {
//     return (
//       <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center px-6">
//         <div className="text-center">
//           <h2 className="text-xl font-bold text-[#4a1525]">
//             {error}
//           </h2>

//           <p className="mt-2 text-gray-600">
            
//           </p>

//           <button
//             onClick={getProfiles}
//             className="mt-5 px-6 py-3 rounded-full bg-[#4a1525] text-white font-semibold"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // -------------------------------------------------------
//   // No more profiles
//   // -------------------------------------------------------

//   if (!currentProfile) {
//     return (
//       <div className="min-h-screen bg-[#fdfbf7] flex flex-col">

//         <div className="flex-1 flex items-center justify-center px-6">

//           <div className="text-center max-w-sm">

//             <div className="text-6xl mb-5">
//               💜
//             </div>

//             <h2 className="text-2xl font-extrabold text-[#4a1525]">
//               You've reached the end
//             </h2>

//             <p className="mt-3 text-gray-600">
//               You've seen everyone available
//               right now. Check back later for
//               new people.
//             </p>

//             <button
//               onClick={getProfiles}
//               className="mt-6 px-7 py-3 rounded-full bg-[#4a1525] text-white font-semibold"
//             >
//               Refresh
//             </button>

//           </div>

//         </div>

//         <Navbar />

//       </div>
//     );
//   }

//   const photos =
//     currentProfile.images || [];

//   const currentImage =
//     photos[photoIndex] ||
//     "/default-profile.jpg";

//   // -------------------------------------------------------
//   // MAIN UI
//   // -------------------------------------------------------

//   return (
//     <div className="flex justify-center">
//     <div className="min-h-screen w-md bg-[#fdfbf7]">

//       <div className="max-w-md mx-auto min-h-screen">

//         {/* --------------------------------------------- */}
//         {/* HEADER */}
//         {/* --------------------------------------------- */}

//         <div className="flex items-center justify-between px-5 pt-7 pb-4">

//           <div>
//             <h1 className="text-2xl font-black text-[#4a1525]">
//               Raas Mitra
//             </h1>

//             <p className="text-xs text-gray-500 mt-1">
//               Discover people
//             </p>
//           </div>

//           <div className="relative">

//             <button
//               onClick={() =>
//                 setShowMenu(
//                   (current) =>
//                     !current
//                 )
//               }
//               className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5"
//             >
//               <FiMoreHorizontal
//                 size={25}
//               />
//             </button>

//           </div>

//         </div>


//         {/* --------------------------------------------- */}
//         {/* PROFILE CARD */}
//         {/* --------------------------------------------- */}

//         <div className="px-4 pb-32">

//           <div
//             key={currentProfile._id}
//             className="bg-white rounded-[28px] overflow-hidden shadow-lg border border-gray-100"
//           >

//             {/* --------------------------------------- */}
//             {/* NAME */}
//             {/* --------------------------------------- */}

//             <div className="px-5 pt-5 pb-3 flex items-center justify-between">

//               <div>

//                 <h2 className="text-3xl font-black text-gray-900">
//                   {currentProfile.username}
//                 </h2>

//                 {currentProfile.age && (
//                   <p className="text-gray-500 mt-1">
//                     {currentProfile.age}
//                   </p>
//                 )}

//               </div>

//               <button
//                 onClick={() =>
//                   setShowMenu(
//                     (current) =>
//                       !current
//                   )
//                 }
//                 className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
//               >
//                 <FiMoreHorizontal />
//               </button>

//             </div>


//             {/* --------------------------------------- */}
//             {/* PHOTO */}
//             {/* --------------------------------------- */}

//             <div className="relative">

//               <img
//                 src={currentImage}
//                 alt={
//                   currentProfile.username ||
//                   "Profile"
//                 }
//                 className="w-full h-[58vh] object-cover"
//               />

             


//               {/* Photo counter */}

//               {photos.length > 1 && (
//                 <div className="absolute top-4 left-4 right-4 flex gap-1">

//                   {photos.map(
//                     (_, index) => (
//                       <div
//                         key={index}
//                         className={`h-1 flex-1 rounded-full ${
//                           index ===
//                           photoIndex
//                             ? "bg-white"
//                             : "bg-white/40"
//                         }`}
//                       />
//                     )
//                   )}

//                 </div>
//               )}


//               {/* Previous */}

//               {photos.length > 1 && (
//                 <button
//                   onClick={
//                     previousPhoto
//                   }
//                   className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center"
//                 >
//                   <FiChevronLeft
//                     size={24}
//                   />
//                 </button>
//               )}


//               {/* Next */}

//               {photos.length > 1 && (
//                 <button
//                   onClick={
//                     nextPhoto
//                   }
//                   className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center"
//                 >
//                   <FiChevronRight
//                     size={24}
//                   />
//                 </button>
//               )}


//               {/* Like photo */}

//               <button
//                 onClick={
//                   likePhoto
//                 }
//                 disabled={processing}
//                 className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
//               >
//                 <FiHeart
//                   size={28}
//                   className="text-red-500"
//                 />
//               </button>

//             </div>


//             {/* --------------------------------------- */}
//             {/* PHOTO LIKE HINT */}
//             {/* --------------------------------------- */}

//             <div className="px-5 pt-3">

//               <p className="text-xs text-gray-400">
//                 Tap ❤️ on a photo to like
//                 something specific
//               </p>

//             </div>


//             {/* --------------------------------------- */}
//             {/* ABOUT */}
//             {/* --------------------------------------- */}

//             {currentProfile.promt1 && (
//               <div className="px-5 pt-6">

//                 <button
//                   onClick={
//                     likePrompt
//                   }
//                   className="w-full text-left border border-gray-200 rounded-2xl p-5 hover:border-[#4a1525]/40 transition"
//                 >

//                   <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
//                     About
//                   </p>

//                   <p className="text-lg font-semibold text-gray-900">
//                     {currentProfile.promt1}
//                   </p>

//                   <div className="mt-4 flex justify-end">

//                     <div className="w-9 h-9 rounded-full border flex items-center justify-center">
//                       <FiHeart
//                         size={17}
//                         className="text-red-400"
//                       />
//                     </div>

//                   </div>

//                 </button>

//               </div>
//             )}


//             {/* --------------------------------------- */}
//             {/* Second PHOTO */}
//             {/* --------------------------------------- */}

//             {photos.length > 1 && (
//               <div className="px-5 pt-6">

//                 <div className="relative">

//                   <img
//                     src={photos[1]}
//                     alt={
//                       currentProfile.username
//                     }
//                     className="w-full h-[55vh] object-cover rounded-2xl"
//                   />

//                   <button
//                     onClick={() => {
//                       setPhotoIndex(1);
//                       likePhoto();
//                       setLikeTarget.id(currentProfile._id)
//                     }}
//                     className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center"
//                   >
//                     <FiHeart
//                       size={27}
//                       className="text-red-500"
//                     />
//                   </button>

//                 </div>

//               </div>
//             )}

            
//              {/* --------------------------------------- */}
//             {/* Second PHOTO */}
//             {/* --------------------------------------- */}

//                    {photos.length > 1 && (
//               <div className="px-5 pt-6">

//                 <div className="relative">

//                   <img
//                     src={photos[2]}
//                     alt={
//                       currentProfile.username
//                     }
//                     className="w-full h-[55vh] object-cover rounded-2xl"
//                   />

//                   <button
//                     onClick={() => {
//                       setPhotoIndex(1);
//                       likePhoto();
//                        setLikeTarget.id(currentProfile._id)
//                     }}
//                     className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center"
//                   >
//                     <FiHeart
//                       size={27}
//                       className="text-red-500"
//                     />
//                   </button>

//                 </div>

//               </div>
//             )}



//               {/* --------------------------------------- */}
//             {/* third PHOTO */}
//             {/* --------------------------------------- */}

//                    {photos.length > 4 && (
//               <div className="px-5 pt-6">

//                 <div className="relative">

//                   <img
//                     src={photos[3]}
//                     alt={
//                       currentProfile.username
//                     }
//                     className="w-full h-[55vh] object-cover rounded-2xl"
//                   />

//                   <button
//                     onClick={() => {
//                       setPhotoIndex(3);
//                       likePhoto();
//                        setLikeTarget.id(currentProfile._id)
//                     }}
//                     className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center"
//                   >
//                     <FiHeart
//                       size={27}
//                       className="text-red-500"
//                     />
//                   </button>

//                 </div>

//               </div>
//             )}

//               {/* --------------------------------------- */}
//             {/* Second PHOTO */}
//             {/* --------------------------------------- */}

//                    {photos.length > 5 && (
//               <div className="px-5 pt-6">

//                 <div className="relative">

//                   <img
//                     src={photos[4]}
//                     alt={
//                       currentProfile.username
//                     }
//                     className="w-full h-[55vh] object-cover rounded-2xl"
//                   />

//                   <button
//                     onClick={() => {
//                       setPhotoIndex(4);
//                       likePhoto();
//                        setLikeTarget.id(currentProfile._id)
//                     }}
//                     className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center"
//                   >
//                     <FiHeart
//                       size={27}
//                       className="text-red-500"
//                     />
//                   </button>

//                 </div>

//               </div>
//             )}


//               {/* --------------------------------------- */}
//             {/* Second PHOTO */}
//             {/* --------------------------------------- */}

//                    {photos.length > 6 && (
//               <div className="px-5 pt-6">

//                 <div className="relative">

//                   <img
//                     src={photos[5]}
//                     alt={
//                       currentProfile.username
//                     }
//                     className="w-full h-[55vh] object-cover rounded-2xl"
//                   />

//                   <button
//                     onClick={() => {
//                       setPhotoIndex(5);
//                       likePhoto();
//                        setLikeTarget.id(currentProfile._id)
//                     }}
//                     className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center"
//                   >
//                     <FiHeart
//                       size={27}
//                       className="text-red-500"
//                     />
//                   </button>

//                 </div>

//               </div>
//             )}

//               {/* --------------------------------------- */}
//             {/* Second PHOTO */}
//             {/* --------------------------------------- */}

//                    {photos.length > 7 && (
//               <div className="px-5 pt-6">

//                 <div className="relative">

//                   <img
//                     src={photos[6]}
//                     alt={
//                       currentProfile.username
//                     }
//                     className="w-full h-[55vh] object-cover rounded-2xl"
//                   />

//                   <button
//                     onClick={() => {
//                       setPhotoIndex(6);
//                       likePhoto();
//                        setLikeTarget.id(currentProfile._id)
//                     }}
//                     className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center"
//                   >
//                     <FiHeart
//                       size={27}
//                       className="text-red-500"
//                     />
//                   </button>

//                 </div>

//               </div>
//             )}


//             {/* --------------------------------------- */}
//             {/* ACTION BUTTONS */}
//             {/* --------------------------------------- */}

//             <div className="flex justify-center gap-5 px-5 py-7">

//               {/* Undo */}

//               <button
//                 onClick={
//                   undoSkip
//                 }
//                 disabled={
//                   !lastSkipped ||
//                   processing
//                 }
//                 className="w-14 h-14 rounded-full border border-yellow-200 bg-yellow-50 flex items-center justify-center disabled:opacity-30"
//               >
//                 <FiCornerUpLeft
//                   size={24}
//                   className="text-yellow-600"
//                 />
//               </button>


//               {/* Skip */}

//               <button
//                 onClick={
//                   skipProfile
//                 }
//                 disabled={processing}
//                 className="w-16 h-16 rounded-full bg-white border border-red-100 shadow-md flex items-center justify-center disabled:opacity-50"
//               >
//                 <FiX
//                   size={30}
//                   className="text-red-500"
//                 />
//               </button>


//               {/* Like */}

//               <button
//                 onClick={()=>{
//                    likeProfile(currentProfile)
//                 }
                 
//                 }
//                 disabled={processing}
//                 className="w-16 h-16 rounded-full bg-[#4a1525] shadow-lg flex items-center justify-center disabled:opacity-50"
//               >
//                 <FiHeart
//                   size={30}
//                   className="text-white"
//                 />
//               </button>

//             </div>

//           </div>

//         </div>


//         {/* --------------------------------------------- */}
//         {/* MORE MENU */}
//         {/* --------------------------------------------- */}

//         {showMenu && (
//           <div className="fixed inset-0 z-50">

//             <button
//               className="absolute inset-0 bg-black/20"
//               onClick={() =>
//                 setShowMenu(false)
//               }
//             />

//             <div className="absolute bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl p-5 shadow-2xl">

//               <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

//               <button
//                 onClick={
//                   blockProfile
//                 }
//                 className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-left"
//               >
//                 <FiSlash
//                   size={22}
//                   className="text-gray-700"
//                 />

//                 <div>
//                   <p className="font-semibold">
//                     Block
//                   </p>

//                   <p className="text-sm text-gray-500">
//                     You won't see this profile again.
//                   </p>
//                 </div>
//               </button>


//               <button
//                 onClick={() => {
//                   setShowMenu(false);
//                   setShowReport(true);
//                 }}
//                 className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-left"
//               >
//                 <FiFlag
//                   size={22}
//                   className="text-red-500"
//                 />

//                 <div>
//                   <p className="font-semibold text-red-600">
//                     Report
//                   </p>

//                   <p className="text-sm text-gray-500">
//                     Report something inappropriate.
//                   </p>
//                 </div>
//               </button>

//             </div>

//           </div>
//         )}


//         {/* --------------------------------------------- */}
//         {/* REPORT MODAL */}
//         {/* --------------------------------------------- */}

//         {showReport && (
//           <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">

//             <div className="bg-white w-full max-w-md rounded-t-3xl p-6">

//               <h2 className="text-xl font-bold">
//                 Report profile
//               </h2>

//               <p className="text-gray-500 text-sm mt-2 mb-5">
//                 Why are you reporting this profile?
//               </p>


//               {[
//                 "Fake profile",
//                 "Inappropriate content",
//                 "Harassment",
//                 "Spam",
//                 "Something else",
//               ].map((reason) => (

//                 <button
//                   key={reason}
//                   onClick={() =>
//                     reportProfile(
//                       reason
//                     )
//                   }
//                   disabled={
//                     processing
//                   }
//                   className="w-full text-left px-4 py-4 border-b hover:bg-gray-50"
//                 >
//                   {reason}
//                 </button>

//               ))}


//               <button
//                 onClick={() =>
//                   setShowReport(false)
//                 }
//                 className="w-full mt-4 py-3 rounded-full bg-gray-100 font-semibold"
//               >
//                 Cancel
//               </button>

//             </div>

//           </div>
//         )}


//         {/* --------------------------------------------- */}
//         {/* COMMENT MODAL */}
//         {/* --------------------------------------------- */}

//         {showComment && (
//           <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">

//             <div className="bg-white w-full max-w-md rounded-t-3xl p-6">

//               <h2 className="text-xl font-bold text-gray-900">
//                 Send a Like
//               </h2>

//               <p className="text-sm text-gray-500 mt-1">
//                 Add a comment if you want to start the conversation.
//               </p>


//               <textarea
//                 value={comment}
//                 onChange={(event) =>
//                   setComment(
//                     event.target.value
//                   )
//                 }
//                 maxLength={500}
//                 placeholder="Say something nice..."
//                 className="w-full mt-5 h-28 border border-gray-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-[#4a1525]/20 resize-none"
//               />


//               <div className="flex gap-3 mt-4">

//                 <button
//                   onClick={() => {
//                     setShowComment(
//                       false
//                     );
//                     setComment("");
//                   }}
//                   className="flex-1 py-3 rounded-full bg-gray-100 font-semibold"
//                 >
//                   Cancel
//                 </button>


//                 <button
//                   onClick={()=>{
//                     submitLike(currentProfile);
//                   }
                    
//                   }
//                   disabled={processing}
//                   className="flex-1 py-3 rounded-full bg-[#4a1525] text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
//                 >
//                   <FiSend />

//                   {processing
//                     ? "Sending..."
//                     : "Send Like"}
//                 </button>

//               </div>

//             </div>

//           </div>
//         )}

//       </div>

//       {/* --------------------------------------------- */}
//       {/* NAVBAR */}
//       {/* --------------------------------------------- */}

//       <div className="fixed bottom-0 left-0 right-0 z-40">
//         <div className="max-w-md mx-auto">
//           <Navbar />
//         </div>
//       </div>

//     </div>
//     </div>
//   );
// }

