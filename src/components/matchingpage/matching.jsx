"use client";

import React, { useEffect, useState } from "react";
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
} from "react-icons/fi";

export default function RaasMitraProfile() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // Current profile
  const [currentIndex, setCurrentIndex] = useState(0);

  // Current photo
  const [photoIndex, setPhotoIndex] = useState(0);

  // More menu
  const [showMenu, setShowMenu] = useState(false);

  // Report menu
  const [showReport, setShowReport] = useState(false);

  // Comment modal
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");

  // What is being liked
  const [likeTarget, setLikeTarget] = useState({
    type: "profile",
    id: null,
  });

  // Last skipped profile for Undo
  const [lastSkipped, setLastSkipped] = useState(null);

  // -------------------------------------------------------
  // Current profile
  // -------------------------------------------------------

  const currentProfile = profiles[currentIndex];

  // -------------------------------------------------------
  // Get profiles
  // -------------------------------------------------------

  const getProfiles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/chatgptroute", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          action: "discover",
          limit: 10,
        }),
      });

      const data = await response.json();
      console.log(data);
       

      if (!response.ok || !data.success) {
         if (response.status === 401 || data.redirect) {
        setTimeout(() => {
          window.location.href = data.url; 
      return;
        }, 3000);
        throw new Error(
          data.message ||
            data.error ||
            "Failed to load profiles."
        );
       
      }
      }

      setProfiles(data.users || []);
      setCurrentIndex(0);
      setPhotoIndex(0);

      
      
    

    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "Could not load profiles."
      );

    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // Initial load
  // -------------------------------------------------------

  useEffect(() => {
    getProfiles();
  }, []);

  // -------------------------------------------------------
  // Move to next profile
  // -------------------------------------------------------

  const nextProfile = () => {
    setPhotoIndex(0);
    setShowMenu(false);
    setShowReport(false);
    setShowComment(false);
    setComment("");

    setCurrentIndex((current) => current + 1);
  };

  // -------------------------------------------------------
  // Remove current profile locally
  // -------------------------------------------------------

  const removeCurrentProfile = () => {
    setProfiles((currentProfiles) => {
      return currentProfiles.filter(
        (_, index) =>
          index !== currentIndex
      );
    });

    setPhotoIndex(0);
  };

  // -------------------------------------------------------
  // Skip profile
  // -------------------------------------------------------

  const skipProfile = async () => {
    if (!currentProfile || processing) {
      return;
    }

    try {
      setProcessing(true);

      const profileId =
        currentProfile._id;

      const response = await fetch(
        "/api/",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            action: "skip",
            profileId,
          }),
        }
      );

      // const data =
      //   await response.json();

      // if (!response.ok || !data.success) {
      //   throw new Error(
      //     data.message ||
      //       "Could not skip profile."
      //   );
      // }

      // Save for undo
      setLastSkipped({
        profile: currentProfile,
        index: currentIndex,
      });

      removeCurrentProfile();

    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Could not skip this profile."
      );

    } finally {
      setProcessing(false);
    }
  };

  // -------------------------------------------------------
  // Undo skip
  // -------------------------------------------------------

  const undoSkip = async () => {
    if (!lastSkipped || processing) {
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch(
        "/api/",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            action: "undo",
            profileId:
              lastSkipped.profile._id,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Could not undo skip."
        );
      }

      setProfiles((currentProfiles) => {
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
      });

      setCurrentIndex(
        Math.min(
          lastSkipped.index,
          profiles.length
        )
      );

      setLastSkipped(null);

    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Could not undo."
      );

    } finally {
      setProcessing(false);
    }
  };

  // -------------------------------------------------------
  // Like profile
  // -------------------------------------------------------

  const likeProfile = async (current) => {
    if (!currentProfile || processing) {
      return;
    }
    console.log(current)
    setLikeTarget({
      type: "profile",
      id: current._id,
    });

    setShowComment(true);
  };

  // -------------------------------------------------------
  // Like photo
  // -------------------------------------------------------

  const likePhoto = () => {
    if (!currentProfile || processing) {
      return;
    }

    const photos =
      currentProfile.images || [];

    if (!photos[photoIndex]) {
      return;
    }

    setLikeTarget({
      type: "photo",
      id: String(currentProfile._id),
    });

    setShowComment(true);
  };

  // -------------------------------------------------------
  // Like prompt
  // -------------------------------------------------------

  const likePrompt = () => {
    if (!currentProfile || processing) {
      return;
    }

    setLikeTarget({
      type: "prompt",
      id: "promt1",
    });

    setShowComment(true);
  };

  // -------------------------------------------------------
  // Submit like
  // -------------------------------------------------------

  const submitLike = async (current) => {
    if (!current || processing) {
      return;
    }
    console.log(current);
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

          body: JSON.stringify({
            action: "like",

            targetType:
              likeTarget.type,

            targetId:
              current._id,

            targetIdphoto:current.images[0],
            targetIdName: current.username,
            comment:
              comment.trim(),
          }),
        }
      );

      // const data = await response.json();
        const data = await response.json();
        console.log(data);
       if( data.message === "You already Liked this profile"){
        setError("You already Liked this profile");
         setTimeout(() => {
          nextProfile()
          setError("");
           return;
          }, 3000);
          
         
       }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Could not send like."
        );
      }

      setShowComment(false);
      setComment("");

      nextProfile();

    } catch (error) {
      
      
      console.error(error);
  
  // 1. Set the error message to display the div
  setError(error.message || "Could not send like.");

  // 2. Hide the div automatically after 3 seconds
  setTimeout(() => {
    setError("");
  }, 3000);

    } finally {
      setProcessing(false);
    }
  };

  // -------------------------------------------------------
  // Block
  // -------------------------------------------------------

 const blockProfile = async () => {
  if (!currentProfile || processing) {
    return;
  }

  const confirmed = window.confirm(
    "Block this profile? You won't see them again."
  );

  if (!confirmed) {
    return;
  }

  try {
    setProcessing(true);

    const response = await fetch("/api/discoverFunctions/blocked", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        profileId: currentProfile._id,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Could not block profile."
      );
    }

    console.log(data);

    setShowMenu(false);

    removeCurrentProfile();

  } catch (error) {
    console.error("BLOCK ERROR:", error);

    alert(
      error.message || "Could not block profile."
    );

  } finally {
    setProcessing(false);
  }
};

  // -------------------------------------------------------
  // Report
  // -------------------------------------------------------

  const reportProfile = async (reason) => {
    if (!currentProfile || processing) {
      return;
    }

    try {
      setProcessing(true);

      const response = await fetch(
        "/api/",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            action: "report",

            profileId:
              currentProfile._id,

            reason,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Could not report profile."
        );
      }

      setShowReport(false);
      setShowMenu(false);

      removeCurrentProfile();

      alert(
        "Thank you. This profile has been reported."
      );

    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Could not report profile."
      );

    } finally {
      setProcessing(false);
    }
  };

  // -------------------------------------------------------
  // Photo navigation
  // -------------------------------------------------------

  const nextPhoto = () => {
    if (!currentProfile) {
      return;
    }

    const photos =
      currentProfile.images || [];

    if (photos.length === 0) {
      return;
    }

    setPhotoIndex(
      (current) =>
        (current + 1) %
        photos.length
    );
  };

  const previousPhoto = () => {
    if (!currentProfile) {
      return;
    }

    const photos =
      currentProfile.images || [];

    if (photos.length === 0) {
      return;
    }

    setPhotoIndex(
      (current) =>
        (current - 1 + photos.length) %
        photos.length
    );
  };

  // -------------------------------------------------------
  // Loading
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // Error
  // -------------------------------------------------------

  if (error) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#4a1525]">
            {error}
          </h2>

          <p className="mt-2 text-gray-600">
            
          </p>

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

  // -------------------------------------------------------
  // No more profiles
  // -------------------------------------------------------

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col">

        <div className="flex-1 flex items-center justify-center px-6">

          <div className="text-center max-w-sm">

            <div className="text-6xl mb-5">
              💜
            </div>

            <h2 className="text-2xl font-extrabold text-[#4a1525]">
              You've reached the end
            </h2>

            <p className="mt-3 text-gray-600">
              You've seen everyone available
              right now. Check back later for
              new people.
            </p>

            <button
              onClick={getProfiles}
              className="mt-6 px-7 py-3 rounded-full bg-[#4a1525] text-white font-semibold"
            >
              Refresh
            </button>

          </div>

        </div>

        <Navbar />

      </div>
    );
  }

  const photos =
    currentProfile.images || [];

  const currentImage =
    photos[photoIndex] ||
    "/default-profile.jpg";

  // -------------------------------------------------------
  // MAIN UI
  // -------------------------------------------------------

  return (
    <div className="flex justify-center">
    <div className="min-h-screen w-md bg-[#fdfbf7]">

      <div className="max-w-md mx-auto min-h-screen">

        {/* --------------------------------------------- */}
        {/* HEADER */}
        {/* --------------------------------------------- */}

        <div className="flex items-center justify-between px-5 pt-7 pb-4">

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
                  (current) =>
                    !current
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


        {/* --------------------------------------------- */}
        {/* PROFILE CARD */}
        {/* --------------------------------------------- */}

        <div className="px-4 pb-32">

          <div
            key={currentProfile._id}
            className="bg-white rounded-[28px] overflow-hidden shadow-lg border border-gray-100"
          >

            {/* --------------------------------------- */}
            {/* NAME */}
            {/* --------------------------------------- */}

            <div className="px-5 pt-5 pb-3 flex items-center justify-between">

              <div>

                <h2 className="text-3xl font-black text-gray-900">
                  {currentProfile.username}
                </h2>

                {currentProfile.age && (
                  <p className="text-gray-500 mt-1">
                    {currentProfile.age}
                  </p>
                )}

              </div>

              <button
                onClick={() =>
                  setShowMenu(
                    (current) =>
                      !current
                  )
                }
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <FiMoreHorizontal />
              </button>

            </div>


            {/* --------------------------------------- */}
            {/* PHOTO */}
            {/* --------------------------------------- */}

            <div className="relative">

              <img
                src={currentImage}
                alt={
                  currentProfile.username ||
                  "Profile"
                }
                className="w-full h-[58vh] object-cover"
              />

             


              {/* Photo counter */}

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


              {/* Previous */}

              {photos.length > 1 && (
                <button
                  onClick={
                    previousPhoto
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center"
                >
                  <FiChevronLeft
                    size={24}
                  />
                </button>
              )}


              {/* Next */}

              {photos.length > 1 && (
                <button
                  onClick={
                    nextPhoto
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center"
                >
                  <FiChevronRight
                    size={24}
                  />
                </button>
              )}


              {/* Like photo */}

              <button
                onClick={
                  likePhoto
                }
                disabled={processing}
                className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
              >
                <FiHeart
                  size={28}
                  className="text-red-500"
                />
              </button>

            </div>


            {/* --------------------------------------- */}
            {/* PHOTO LIKE HINT */}
            {/* --------------------------------------- */}

            <div className="px-5 pt-3">

              <p className="text-xs text-gray-400">
                Tap ❤️ on a photo to like
                something specific
              </p>

            </div>


            {/* --------------------------------------- */}
            {/* ABOUT */}
            {/* --------------------------------------- */}

            {currentProfile.promt1 && (
              <div className="px-5 pt-6">

                <button
                  onClick={
                    likePrompt
                  }
                  className="w-full text-left border border-gray-200 rounded-2xl p-5 hover:border-[#4a1525]/40 transition"
                >

                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                    About
                  </p>

                  <p className="text-lg font-semibold text-gray-900">
                    {currentProfile.promt1}
                  </p>

                  <div className="mt-4 flex justify-end">

                    <div className="w-9 h-9 rounded-full border flex items-center justify-center">
                      <FiHeart
                        size={17}
                        className="text-red-400"
                      />
                    </div>

                  </div>

                </button>

              </div>
            )}


            {/* --------------------------------------- */}
            {/* Second PHOTO */}
            {/* --------------------------------------- */}

            {photos.length > 1 && (
              <div className="px-5 pt-6">

                <div className="relative">

                  <img
                    src={photos[1]}
                    alt={
                      currentProfile.username
                    }
                    className="w-full h-[55vh] object-cover rounded-2xl"
                  />

                  <button
                    onClick={() => {
                      setPhotoIndex(1);
                      likePhoto();
                      setLikeTarget.id(currentProfile._id)
                    }}
                    className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center"
                  >
                    <FiHeart
                      size={27}
                      className="text-red-500"
                    />
                  </button>

                </div>

              </div>
            )}

            
             {/* --------------------------------------- */}
            {/* Second PHOTO */}
            {/* --------------------------------------- */}

                   {photos.length > 1 && (
              <div className="px-5 pt-6">

                <div className="relative">

                  <img
                    src={photos[2]}
                    alt={
                      currentProfile.username
                    }
                    className="w-full h-[55vh] object-cover rounded-2xl"
                  />

                  <button
                    onClick={() => {
                      setPhotoIndex(1);
                      likePhoto();
                       setLikeTarget.id(currentProfile._id)
                    }}
                    className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center"
                  >
                    <FiHeart
                      size={27}
                      className="text-red-500"
                    />
                  </button>

                </div>

              </div>
            )}



              {/* --------------------------------------- */}
            {/* third PHOTO */}
            {/* --------------------------------------- */}

                   {photos.length > 4 && (
              <div className="px-5 pt-6">

                <div className="relative">

                  <img
                    src={photos[3]}
                    alt={
                      currentProfile.username
                    }
                    className="w-full h-[55vh] object-cover rounded-2xl"
                  />

                  <button
                    onClick={() => {
                      setPhotoIndex(3);
                      likePhoto();
                       setLikeTarget.id(currentProfile._id)
                    }}
                    className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center"
                  >
                    <FiHeart
                      size={27}
                      className="text-red-500"
                    />
                  </button>

                </div>

              </div>
            )}

              {/* --------------------------------------- */}
            {/* Second PHOTO */}
            {/* --------------------------------------- */}

                   {photos.length > 5 && (
              <div className="px-5 pt-6">

                <div className="relative">

                  <img
                    src={photos[4]}
                    alt={
                      currentProfile.username
                    }
                    className="w-full h-[55vh] object-cover rounded-2xl"
                  />

                  <button
                    onClick={() => {
                      setPhotoIndex(4);
                      likePhoto();
                       setLikeTarget.id(currentProfile._id)
                    }}
                    className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center"
                  >
                    <FiHeart
                      size={27}
                      className="text-red-500"
                    />
                  </button>

                </div>

              </div>
            )}


              {/* --------------------------------------- */}
            {/* Second PHOTO */}
            {/* --------------------------------------- */}

                   {photos.length > 6 && (
              <div className="px-5 pt-6">

                <div className="relative">

                  <img
                    src={photos[5]}
                    alt={
                      currentProfile.username
                    }
                    className="w-full h-[55vh] object-cover rounded-2xl"
                  />

                  <button
                    onClick={() => {
                      setPhotoIndex(5);
                      likePhoto();
                       setLikeTarget.id(currentProfile._id)
                    }}
                    className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center"
                  >
                    <FiHeart
                      size={27}
                      className="text-red-500"
                    />
                  </button>

                </div>

              </div>
            )}

              {/* --------------------------------------- */}
            {/* Second PHOTO */}
            {/* --------------------------------------- */}

                   {photos.length > 7 && (
              <div className="px-5 pt-6">

                <div className="relative">

                  <img
                    src={photos[6]}
                    alt={
                      currentProfile.username
                    }
                    className="w-full h-[55vh] object-cover rounded-2xl"
                  />

                  <button
                    onClick={() => {
                      setPhotoIndex(6);
                      likePhoto();
                       setLikeTarget.id(currentProfile._id)
                    }}
                    className="absolute bottom-4 right-4 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center"
                  >
                    <FiHeart
                      size={27}
                      className="text-red-500"
                    />
                  </button>

                </div>

              </div>
            )}


            {/* --------------------------------------- */}
            {/* ACTION BUTTONS */}
            {/* --------------------------------------- */}

            <div className="flex justify-center gap-5 px-5 py-7">

              {/* Undo */}

              <button
                onClick={
                  undoSkip
                }
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


              {/* Skip */}

              <button
                onClick={
                  skipProfile
                }
                disabled={processing}
                className="w-16 h-16 rounded-full bg-white border border-red-100 shadow-md flex items-center justify-center disabled:opacity-50"
              >
                <FiX
                  size={30}
                  className="text-red-500"
                />
              </button>


              {/* Like */}

              <button
                onClick={()=>{
                   likeProfile(currentProfile)
                }
                 
                }
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


        {/* --------------------------------------------- */}
        {/* MORE MENU */}
        {/* --------------------------------------------- */}

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

              <button
                onClick={
                  blockProfile
                }
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 text-left"
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


        {/* --------------------------------------------- */}
        {/* REPORT MODAL */}
        {/* --------------------------------------------- */}

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
                    reportProfile(
                      reason
                    )
                  }
                  disabled={
                    processing
                  }
                  className="w-full text-left px-4 py-4 border-b hover:bg-gray-50"
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


        {/* --------------------------------------------- */}
        {/* COMMENT MODAL */}
        {/* --------------------------------------------- */}

        {showComment && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">

            <div className="bg-white w-full max-w-md rounded-t-3xl p-6">

              <h2 className="text-xl font-bold text-gray-900">
                Send a Like
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Add a comment if you want to start the conversation.
              </p>


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


              <div className="flex gap-3 mt-4">

                <button
                  onClick={() => {
                    setShowComment(
                      false
                    );
                    setComment("");
                  }}
                  className="flex-1 py-3 rounded-full bg-gray-100 font-semibold"
                >
                  Cancel
                </button>


                <button
                  onClick={()=>{
                    submitLike(currentProfile);
                  }
                    
                  }
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

      </div>

      {/* --------------------------------------------- */}
      {/* NAVBAR */}
      {/* --------------------------------------------- */}

      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto">
          <Navbar />
        </div>
      </div>

    </div>
    </div>
  );
}

