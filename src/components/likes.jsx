
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  FiPlus,
  FiMusic,
  FiHeart,
  FiMessageCircle,
  FiX,
} from "react-icons/fi";

import Background from "@/components/matchingpage/backgroundblur";
import Navbar from "@/components/Navbar";

export default function RaasMitraLikesView() {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
 const [matchMessage, setMatchMessage] = useState("");
  // Popup
  const [selectedLike, setSelectedLike] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  // Match loading
  const [matching, setMatching] = useState(false);

  // ============================================
  // GET LIKES
  // ============================================

  
const getLikedProfiles = async () => {
  try {
    setLoading(true);

    const response = await fetch("/api/getLikedprof", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    // Read as text first so an empty/non-JSON response doesn't crash with
    // "Unexpected end of JSON input".
    const text = await response.text();

    console.log("GET LIKES STATUS:", response.status);
    console.log("GET LIKES RESPONSE:", text);

    if (!text) {
      throw new Error(
        `Empty response from /api/discoverFunctions/likes (HTTP ${response.status})`
      );
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("INVALID JSON FROM GET LIKES:", text);
      throw new Error("Server returned invalid JSON.");
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to get likes.");
    }

    const receivedLikes = data.likes || [];

    setLikes(receivedLikes);

    // Open popup automatically if at least one like exists
    if (receivedLikes.length > 0) {
      setSelectedLike(receivedLikes[0]);
      setShowPopup(true);
    }
  } catch (error) {
    console.error("GET LIKES ERROR:", error);
    setLikes([]);
  } finally {
    setLoading(false);
  }
};

const matchWithUser = async () => {
  if (!selectedLike || matching) {
    return;
  }

  try {
    setMatching(true);
    setMatchMessage("");

    const response = await fetch(
      "/api/discoverFunctions/match",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          likeId: selectedLike.likeId,
        }),
      }
    );

    const data = await response.json();

    console.log("MATCH STATUS:", response.status);
    console.log("MATCH RESPONSE:", data);

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Could not create match."
      );
    }

    // Remove the matched like from the UI.
    // IMPORTANT:
    // If your likes state has a different name,
    // replace `setReceivedLikes` with that setter.
   

    setShowPopup(false);
    setSelectedLike(null);

    setMatchMessage(
      data.message || "You matched successfully!"
    );

    setTimeout(() => {
      setMatchMessage("");
    }, 3000);
  } catch (error) {
    console.error("MATCH ERROR:", error);

    setMatchMessage(
      error.message || "Could not create match."
    );

    setTimeout(() => {
      setMatchMessage("");
    }, 3000);
  } finally {
    setMatching(false);
  }
};

 const fetchMatches = async () => {
    try {
      setLoadingMatches(true);

      const res = await fetch("/api/getchatprofiles", {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();
      console.log("data hi idhar");
      console.log(data);
      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch matches");
      }

      setMatches(data.matches || []);
    } catch (error) {
      console.error("FETCH MATCHES ERROR:", error);
      setMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };


{matchMessage && (
  <div>
    {matchMessage}
  </div>
)}


  // ============================================
  // LOAD LIKES
  // ============================================

  useEffect(() => {
    getLikedProfiles();

    fetchMatches();
  }, []);


  // ============================================
  // CLOSE POPUP
  // ============================================

  const closePopup = () => {
    setShowPopup(false);
    setSelectedLike(null);
  };

  // ============================================
  // MATCH WITH USER
  // ============================================



  // ============================================
  // VISIT PROFILE
  // ============================================

  const visitProfile = () => {
    if (!selectedLike?.from?.profileId) {
      return;
    }

    console.log(
      "VISIT PROFILE:",
      selectedLike.from.profileId
    );

    // Put your profile route here.
    // Example:
    //
    // router.push(
    //   `/profile/${selectedLike.from.profileId}`
    // );
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen">

      {/* Background */}
      <div className="fixed min-h-screen inset-0 z-10">
        <Background />
      </div>

      {/* Main container */}
      <div className="w-full max-w-[412px] pb-2 inset-0 z-50 min-h-screen sm:h-[100vh] sm:rounded-[40px] bg-[#fdfbf7] flex flex-col overflow-hidden shadow-2xl relative">

        {/* Header */}
        <div className="px-5 pt-5 pb-2 flex justify-between items-center bg-[#fdfbf7]">
          <div className="flex items-center flex-row-reverse w-full gap-2 rounded-full">

            <div className="bg-[#4a1525]/10 flex rounded-2xl px-3 py-1.5">

              <FiHeart
                className="text-[#4a1525] fill-[#4a1525]"
                size={16}
              />

              <span className="text-xs ml-2 font-bold text-[#4a1525]">
                {matches.length} Likes
              </span>

            </div>
          </div>
        </div>

        {/* Share Your Vibe */}
        <div className="h-[24%] min-h-[150px] px-5 border-b border-[#eae5de] flex flex-col justify-center bg-[#fdfbf7]">

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Share Your Vibe
          </p>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">

            {/* Add Story */}
            <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">

              <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#4a1525]/40 flex items-center justify-center bg-white group-hover:border-[#4a1525] transition-colors">

                <FiPlus
                  className="text-[#4a1525]"
                  size={22}
                />

              </div>

              <span className="text-[11px] font-medium text-gray-700 mt-1.5">
                Add Story
              </span>

            </div>

            {/* Add Song */}
            <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">

              <div className="w-14 h-14 rounded-full bg-[#4a1525] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">

                <FiMusic
                  className="text-white"
                  size={20}
                />

              </div>

              <span className="text-[11px] font-medium text-gray-700 mt-1.5">
                Add Song
              </span>

            </div>

          </div>
        </div>

        {/* Likes */}
        <div className="flex-1 overflow-y-auto p-5 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#4a1525]/20 [&::-webkit-scrollbar-thumb]:rounded-full">

          <div className="flex justify-between items-center mb-4">

            {/* <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              People who liked you
            </h2> */}

            <span className="text-xs font-semibold text-[#4a1525] bg-[#4a1525]/10 px-2 py-0.5 rounded-md">
              Recent
            </span>

          </div>

          {/* Loading */}
          {loading ?(
            <div className="text-center py-10">

              <p className="text-sm text-gray-500">
                Loading likes...
              </p>

            </div>
          ):(<div>
            {/* Matches */}
<div className="mt-6">

  <div className="flex justify-between items-center mb-4">
    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
      Your Matches
    </h2>

    <span className="text-xs font-semibold text-[#4a1525] bg-[#4a1525]/10 px-2 py-0.5 rounded-md">
      {matches.length}
    </span>
  </div>

  {loadingMatches ? (
    <div className="text-center py-6">
      <p className="text-sm text-gray-500">
        Loading matches...
      </p>
    </div>
  ) : matches.length === 0 ? (
    <div className="text-center py-6">
      <FiHeart
        className="mx-auto text-[#4a1525]/30"
        size={35}
      />

      <p className="text-sm text-gray-500 mt-3">
        No matches yet.
      </p>
    </div>
  ) : (
    <div className="space-y-3">

      {matches.map((match) => (
        <div
          key={String(match.profileId)}
          className="bg-white p-3.5 rounded-2xl border border-[#eae5de] shadow-sm flex items-center justify-between hover:border-[#4a1525]/30 transition-all cursor-pointer group"
        >

          <div className="flex items-center gap-3.5">

            {/* Image */}
            <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border border-[#eae5de]">

              <Image
                src={
                  match.images[0] ||
                  "/default-avatar.png"
                }
                alt={
                  match.username ||
                  "Profile"
                }
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />

              <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                <FiHeart
                  className="text-[#4a1525] fill-[#4a1525]"
                  size={10}
                />
              </div>

            </div>

            {/* Name */}
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {match.username || "Unknown"}
              </h3>

              <p className="text-xs text-gray-600 mt-0.5">
                {match.status || "Connected"}
              </p>
            </div>

          </div>

          {/* Message */}
          <button
            className="w-10 h-10 rounded-full bg-[#f7f3ed] flex items-center justify-center text-[#4a1525] group-hover:bg-[#4a1525] group-hover:text-white transition-colors"
          >
            <FiMessageCircle size={18} />
          </button>

        </div>
      ))}

    </div>
  )}

</div>
          </div>)}

          {/* Empty */}
          {!loading && likes.length === 0 && (
            <div className="text-center py-10">

              {/* <FiHeart
                className="mx-auto text-[#4a1525]/30"
                size={40}
              />

              <p className="text-sm text-gray-500 mt-3">
                No one has liked you yet.
              </p> */}

            </div>
          )}

          {/* Likes */}
          {!loading && likes.length > 0 && (
            <div className="space-y-3">

              {likes.map((like) => {

                const profile = like.from;

                const image =
                  profile?.images?.[0] ||
                  "/default-avatar.png";

                return (
                  <div
                    key={String(like.likeId)}
                    onClick={() => {
                      setSelectedLike(like);
                      setShowPopup(true);
                    }}
                    className="bg-white p-3.5 rounded-2xl border border-[#eae5de] shadow-sm flex items-center justify-between hover:border-[#4a1525]/30 transition-all cursor-pointer group"
                  >

                    <div className="flex items-center gap-3.5">

                      {/* Profile image */}
                      <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border border-[#eae5de]">

                        <Image
                          src={image}
                          alt={
                            profile?.username ||
                            "Profile"
                          }
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">

                          <FiHeart
                            className="text-[#4a1525] fill-[#4a1525]"
                            size={10}
                          />

                        </div>

                      </div>

                      {/* Profile info */}
                      <div>

                        <h3 className="text-base font-bold text-gray-900 leading-tight">
                          {profile?.username ||
                            "Unknown"}
                        </h3>

                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">

                          {like.comment
                            ? like.comment
                            : `Liked your ${
                                like.targetType ||
                                "profile"
                              }`}

                        </p>

                      </div>

                    </div>

                    {/* Message */}
                    <div className="w-10 h-10 rounded-full bg-[#f7f3ed] flex items-center justify-center text-[#4a1525] group-hover:bg-[#4a1525] group-hover:text-white transition-colors">

                      <FiMessageCircle
                        size={18}
                      />

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

        {/* Navbar */}
        <div className="inset-0 z-50 mt-3">
          <Navbar />
        </div>

      </div>

      {/* ================================================= */}
      {/* LIKE POPUP */}
      {/* ================================================= */}

      {showPopup && selectedLike && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-5">

          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closePopup}
          />

          {/* Popup */}
          <div className="relative w-full max-w-[370px] bg-[#fdfbf7] rounded-[30px] p-6 shadow-2xl">

            {/* Close */}
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#f7f3ed] flex items-center justify-center text-gray-600 hover:bg-[#4a1525] hover:text-white transition"
            >
              <FiX size={18} />
            </button>

            {/* Heart */}
            <div className="flex justify-center mb-4">

              <div className="w-10 h-10 rounded-full bg-[#4a1525]/10 flex items-center justify-center">

                <FiHeart
                  className="text-[#4a1525] fill-[#4a1525]"
                  size={20}
                />

              </div>

            </div>

            {/* Profile image */}
            <div className="flex justify-center">

              <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg">

                <Image
                  src={
                    selectedLike.from?.images?.[0] ||
                    "/default-avatar.png"
                  }
                  alt={
                    selectedLike.from?.username ||
                    "Profile"
                  }
                  fill
                  className="object-cover"
                />

              </div>

            </div>

            {/* Name */}
            <h2 className="text-xl font-bold text-gray-900 text-center mt-4">

              {selectedLike.from?.username ||
                "Someone"}

            </h2>

            {/* Like message */}
            <p className="text-sm text-gray-500 text-center mt-1">

              {selectedLike.from?.username ||
                "Someone"}{" "}
              liked your{" "}
              <span className="font-semibold text-[#4a1525]">
                {selectedLike.targetType ||
                  "profile"}
              </span>

            </p>

            {/* Comment */}
            {selectedLike.comment && (
              <p className="text-sm text-gray-600 text-center mt-3 italic">
                "{selectedLike.comment}"
              </p>
            )}

            {/* Visit Profile */}
            <button
              onClick={visitProfile}
              className="w-full mt-6 py-3 rounded-2xl border border-[#4a1525] text-[#4a1525] font-semibold hover:bg-[#4a1525] hover:text-white transition"
            >
              Visit Profile
            </button>

            {/* Match */}
            <button
              onClick={matchWithUser}
              disabled={matching}
              className="w-full mt-3 py-3 rounded-2xl bg-[#4a1525] text-white font-semibold hover:bg-[#35101b] transition disabled:opacity-60"
            >
              {matching
                ? "Matching..."
                : `Match with ${
                    selectedLike.from?.username ||
                    "them"
                  }`}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}







// "use client";

// import React, { useEffect, useState } from "react";
// import Image from "next/image";
// import {
//   FiPlus,
//   FiMusic,
//   FiHeart,
//   FiMessageCircle,
// } from "react-icons/fi";

// import Background from "@/components/matchingpage/backgroundblur";
// import Navbar from "@/components/Navbar";

// export default function RaasMitraLikesView() {
//   const [likes, setLikes] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const getLikedProfiles = async () => {
//     try {
//       setLoading(true);

//      const response = await fetch("/api/discoverFunctions/likes", {
//   method: "GET",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// const data = await response.json();

// if (!response.ok || !data.success) {
//   throw new Error(data.message || "Failed to get likes.");
// }

// setLikes(data.likes || []);
//     } catch (error) {
//       console.error("GET LIKES ERROR:", error);
//       setLikes([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     getLikedProfiles();
//   }, []);

//   return (
//     <div className="flex flex-col justify-center items-center min-h-screen">
//       {/* Background */}
//       <div className="fixed min-h-screen inset-0 z-10">
//         <Background />
//       </div>

//       {/* Main mobile container */}
//       <div className="w-full max-w-[412px] pb-2 inset-0 z-50 min-h-screen sm:h-[100vh] sm:rounded-[40px] bg-[#fdfbf7] flex flex-col overflow-hidden shadow-2xl relative">

//         {/* Header */}
//         <div className="px-5 pt-5 pb-2 flex justify-between items-center bg-[#fdfbf7]">
//           <div className="flex items-center flex-row-reverse w-full gap-2 rounded-full">
//             <div className="bg-[#4a1525]/10 flex rounded-2xl px-3 py-1.5">
//               <FiHeart
//                 className="text-[#4a1525] fill-[#4a1525]"
//                 size={16}
//               />

//               <span className="text-xs ml-2 font-bold text-[#4a1525]">
//                 {likes.length} Likes
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Share Your Vibe */}
//         <div className="h-[24%] min-h-[150px] px-5 border-b border-[#eae5de] flex flex-col justify-center bg-[#fdfbf7]">
//           <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
//             Share Your Vibe
//           </p>

//           <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">

//             {/* Add Story */}
//             <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
//               <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#4a1525]/40 flex items-center justify-center bg-white group-hover:border-[#4a1525] transition-colors">
//                 <FiPlus
//                   className="text-[#4a1525]"
//                   size={22}
//                 />
//               </div>

//               <span className="text-[11px] font-medium text-gray-700 mt-1.5">
//                 Add Story
//               </span>
//             </div>

//             {/* Add Song */}
//             <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
//               <div className="w-14 h-14 rounded-full bg-[#4a1525] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
//                 <FiMusic
//                   className="text-white"
//                   size={20}
//                 />
//               </div>

//               <span className="text-[11px] font-medium text-gray-700 mt-1.5">
//                 Add Song
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Likes */}
//         <div className="flex-1 overflow-y-auto p-5 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#4a1525]/20 [&::-webkit-scrollbar-thumb]:rounded-full">

//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
//               People who liked you
//             </h2>

//             <span className="text-xs font-semibold text-[#4a1525] bg-[#4a1525]/10 px-2 py-0.5 rounded-md">
//               Recent
//             </span>
//           </div>

//           {/* Loading */}
//           {loading && (
//             <div className="text-center py-10">
//               <p className="text-sm text-gray-500">
//                 Loading likes...
//               </p>
//             </div>
//           )}

//           {/* Empty */}
//           {!loading && likes.length === 0 && (
//             <div className="text-center py-10">
//               <FiHeart
//                 className="mx-auto text-[#4a1525]/30"
//                 size={40}
//               />

//               <p className="text-sm text-gray-500 mt-3">
//                 No one has liked you yet.
//               </p>
//             </div>
//           )}

//           {/* Backend profiles */}
//           {!loading && likes.length > 0 && (
//             <div className="space-y-3">
//               {likes.map((like) => {
//                 const profile = like.from;

//                 const image =
//                   profile?.images?.[0] ||
//                   "/default-avatar.png";

//                 return (
//                   <div
//                     key={String(like.likeId)}
//                     className="bg-white p-3.5 rounded-2xl border border-[#eae5de] shadow-sm flex items-center justify-between hover:border-[#4a1525]/30 transition-all cursor-pointer group"
//                   >
//                     <div className="flex items-center gap-3.5">

//                       {/* Profile image */}
//                       <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border border-[#eae5de]">
//                         <Image
//                           src={image}
//                           alt={profile?.username || "Profile"}
//                           fill
//                           className="object-cover group-hover:scale-105 transition-transform duration-300"
//                         />

//                         <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
//                           <FiHeart
//                             className="text-[#4a1525] fill-[#4a1525]"
//                             size={10}
//                           />
//                         </div>
//                       </div>

//                       {/* Profile information */}
//                       <div>
//                         <h3 className="text-base font-bold text-gray-900 leading-tight">
//                           {profile?.username || "Unknown"}
//                         </h3>

//                         {like.comment ? (
//                           <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
//                             {like.comment}
//                           </p>
//                         ) : (
//                           <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
//                             Liked your {like.targetType || "profile"}
//                           </p>
//                         )}
//                       </div>
//                     </div>

//                     {/* Message */}
//                     <div className="w-10 h-10 rounded-full bg-[#f7f3ed] flex items-center justify-center text-[#4a1525] group-hover:bg-[#4a1525] group-hover:text-white transition-colors">
//                       <FiMessageCircle size={18} />
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {/* Navbar */}
//         <div className="inset-0 z-50 mt-3">
//           <Navbar />
//         </div>
//       </div>
//     </div>
//   );
// }



// // import React, { useEffect } from "react";
// // import Image from "next/image";
// // import { FiPlus, FiMusic, FiHeart, FiMessageCircle, FiChevronRight } from "react-icons/fi";
// // import Background from "@/components/matchingpage/backgroundblur"
// // import Navbar from '@/components/Navbar'

// // export default function RaasMitraLikesView() {
// //   const likesData = [
// //     {
// //       id: 1,
// //       name: "Ananya",
// //       age: 24,
// //       image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
// //       text: "Liked your photo: 'Chai on a rainy balcony...'",
// //       time: "2h ago",
// //     },
// //     {
// //       id: 2,
// //       name: "Priya",
// //       age: 23,
// //       image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
// //       text: "Liked your prompt response about history.",
// //       time: "5h ago",
// //     },
// //     {
// //       id: 3,
// //       name: "Meera",
// //       age: 25,
// //       image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
// //       text: "Liked your song: 'Kehna Hi Kya - Bombay Theme'",
// //       time: "1d ago",
// //     },
// //     {
// //       id: 4,
// //       name: "Rhea",
// //       age: 22,
// //       image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
// //       text: "Liked your photo at the museum.",
// //       time: "2d ago",
// //     }
// //   ];

// //   const getLikedProfiles=async()=>{
// //     const response = await fetch("/api/getLikedprof",{method:"POST"});
// //     const data = await response.json();
// //     console.log(data.message);
// //   }

// //   useEffect(()=>{
// //     getLikedProfiles();
// //   },[])

// //   return (
// //     <div className=" flex  flex-col  justify-center items-center min-h-screen">
// //         <div className="fixed min-h-screen inset-0 z-10">
// //         <Background/>
// //         </div>
// //       {/* Mobile Frame Container */}
// //       <div className="w-full max-w-[412px] pb-2 inset-0 z-50 min-h-screen sm:h-[100vh] sm:rounded-[40px] bg-[#fdfbf7] flex flex-col overflow-hidden shadow-2xl relative">
        
// //         {/* Top Header / App Title */}
// //         <div className="px-5 pt-5 pb-2 flex justify-between items-center bg-[#fdfbf7]">
          
// //           <div className="flex items-center flex-row-reverse w-full gap-2 rounded-full">
// //             <div className=" bg-[#4a1525]/10 flex rounded-2xl px-3 py-1.5">
// //             <FiHeart className="text-[#4a1525]  fill-[#4a1525]" size={16} />
// //             <span className="text-xs ml-auto  font-bold text-[#4a1525]">14 Likes</span>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Top 1/4 Section: Stories and Songs Upload / Shortcuts */}
// //         <div className="h-[24%] min-h-[150px] px-5  border-b border-[#eae5de] flex flex-col justify-center bg-[#fdfbf7]">
// //           <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
// //             Share Your Vibe
// //           </p>
// //           <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            
// //             {/* Add Story Button */}
// //             <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
// //               <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#4a1525]/40 flex items-center justify-center bg-white group-hover:border-[#4a1525] transition-colors">
// //                 <FiPlus className="text-[#4a1525]" size={22} />
// //               </div>
// //               <span className="text-[11px] font-medium text-gray-700 mt-1.5">Add Story</span>
// //             </div>

// //             {/* Add Song Button */}
// //             <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
// //               <div className="w-14 h-14 rounded-full bg-[#4a1525] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
// //                 <FiMusic className="text-white" size={20} />
// //               </div>
// //               <span className="text-[11px] font-medium text-gray-700 mt-1.5">Add Song</span>
// //             </div>

// //             {/* Active Story Preview Mock */}
// //             <div className="flex flex-col items-center flex-shrink-0 cursor-pointer">
// //               <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 to-[#4a1525]">
// //                 <div className="w-full h-full rounded-full overflow-hidden relative border-2 border-white">
// //                   <Image 
// //                     src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
// //                     alt="Your Story" 
// //                     fill 
// //                     className="object-cover"
// //                   />
// //                 </div>
// //               </div>
// //               <span className="text-[11px] font-medium text-gray-700 mt-1.5">Your Vibe</span>
// //             </div>

// //           </div>
// //         </div>

// //         {/* Bottom Section: Scrollable List of People Who Sent You Likes */}
// //         <div className="flex-1 overflow-y-auto p-5 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#4a1525]/20 [&::-webkit-scrollbar-thumb]:rounded-full">
// //           <div className="flex justify-between items-center mb-4">
// //             <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
// //               People who liked you
// //             </h2>
// //             <span className="text-xs font-semibold text-[#4a1525] bg-[#4a1525]/10 px-2 py-0.5 rounded-md">
// //               Recent
// //             </span>
// //           </div>

// //           <div className="space-y-3">
// //             {likesData.map((person) => (
// //               <div 
// //                 key={person.id} 
// //                 className="bg-white p-3.5 rounded-2xl border border-[#eae5de] shadow-sm flex items-center justify-between hover:border-[#4a1525]/30 transition-all cursor-pointer group"
// //               >
// //                 <div className="flex items-center gap-3.5">
// //                   <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border border-[#eae5de]">
// //                     <Image 
// //                       src={person.image} 
// //                       alt={person.name} 
// //                       fill 
// //                       className="object-cover group-hover:scale-105 transition-transform duration-300"
// //                     />
// //                     <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
// //                       <FiHeart className="text-[#4a1525] fill-[#4a1525]" size={10} />
// //                     </div>
// //                   </div>

// //                   <div>
// //                     <h3 className="text-base font-bold text-gray-900 leading-tight">
// //                       {person.name}, <span className="font-normal text-gray-500">{person.age}</span>
// //                     </h3>
// //                     <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
// //                       {person.text}
// //                     </p>
// //                     <span className="text-[10px] text-gray-400 mt-1 block">
// //                       {person.time}
// //                     </span>
// //                   </div>
// //                 </div>

// //                 <div className="w-10 h-10 rounded-full bg-[#f7f3ed] flex items-center justify-center text-[#4a1525] group-hover:bg-[#4a1525] group-hover:text-white transition-colors">
// //                   <FiMessageCircle size={18} />
// //                 </div>
// //               </div>
// //             ))}
// //           </div>

// //         </div>
// //         <div className="inset-0 z-50 mt-3">
// //       <Navbar/>
// //       </div>

// //       </div>
      
// //     </div>
// //   );
// // }