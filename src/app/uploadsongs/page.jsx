"use client";

import { useEffect, useRef, useState } from "react";

export default function SongsPage() {
  const audioRef = useRef(null);

  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  /*
   * -------------------------------------------------------
   * PLAY SONG
   * -------------------------------------------------------
   */

  const playSong = async (song) => {
    if (!audioRef.current) return;

    setCurrentSong(song);

    audioRef.current.src = song.audioUrl;
    audioRef.current.volume = volume;

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Playback error:", error);
    }
  };

  /*
   * -------------------------------------------------------
   * PLAY / PAUSE
   * -------------------------------------------------------
   */

  const togglePlay = async () => {
    if (!audioRef.current || !currentSong) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error(error);
      }
    }
  };

  /*
   * -------------------------------------------------------
   * NEXT SONG
   * -------------------------------------------------------
   */

  const nextSong = () => {
    if (!songs.length) return;

    const currentIndex = songs.findIndex(
      (song) => song.id === currentSong?.id
    );

    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + 1) % songs.length;

    playSong(songs[nextIndex]);
  };

  /*
   * -------------------------------------------------------
   * PREVIOUS SONG
   * -------------------------------------------------------
   */

  const previousSong = () => {
    if (!songs.length) return;

    const currentIndex = songs.findIndex(
      (song) => song.id === currentSong?.id
    );

    const previousIndex =
      currentIndex <= 0
        ? songs.length - 1
        : currentIndex - 1;

    playSong(songs[previousIndex]);
  };

  /*
   * -------------------------------------------------------
   * TIME UPDATE
   * -------------------------------------------------------
   */

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;

    setCurrentTime(audioRef.current.currentTime);
  };

  /*
   * -------------------------------------------------------
   * AUDIO LOADED
   * -------------------------------------------------------
   */

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;

    setDuration(audioRef.current.duration || 0);
  };

  /*
   * -------------------------------------------------------
   * SONG ENDED
   * -------------------------------------------------------
   */

  const handleEnded = () => {
    nextSong();
  };

  /*
   * -------------------------------------------------------
   * SEEK
   * -------------------------------------------------------
   */

  const handleSeek = (e) => {
    const value = Number(e.target.value);

    if (!audioRef.current) return;

    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  /*
   * -------------------------------------------------------
   * VOLUME
   * -------------------------------------------------------
   */

  const handleVolume = (e) => {
    const value = Number(e.target.value);

    setVolume(value);

    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  /*
   * -------------------------------------------------------
   * FORMAT TIME
   * -------------------------------------------------------
   */

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) {
      return "0:00";
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /*
   * -------------------------------------------------------
   * UPLOAD SONG
   * -------------------------------------------------------
   */

  const uploadSong = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select an audio file.");
      return;
    }

    if (!title.trim()) {
      setMessage("Please enter a song title.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      const formData = new FormData();

      formData.append("file", file);
      formData.append("title", title);
      formData.append("artist", artist);
      formData.append("genre", genre);

      const response = await fetch("/api/songs/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to upload song"
        );
      }

      const newSong = {
        id: Date.now().toString(),
        ...data.song,
      };

      setSongs((prev) => [...prev, newSong]);

      setTitle("");
      setArtist("");
      setGenre("");
      setFile(null);

      const fileInput =
        document.getElementById("song-file");

      if (fileInput) {
        fileInput.value = "";
      }

      setMessage("Song uploaded successfully!");

      /*
       * Automatically play uploaded song
       */
      playSong(newSong);
    } catch (error) {
      console.error(error);

      setMessage(
        error.message || "Something went wrong."
      );
    } finally {
      setUploading(false);
    }
  };

  /*
   * -------------------------------------------------------
   * KEYBOARD SPACE = PLAY / PAUSE
   * -------------------------------------------------------
   */

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        const target = e.target;

        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA"
        ) {
          return;
        }

        e.preventDefault();

        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isPlaying, currentSong]);

  return (
    <main className="min-h-screen bg-[#09090b] text-white">

      {/* AUDIO ELEMENT */}

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* PAGE */}

      <div className="mx-auto max-w-6xl px-5 py-10">

        {/* HEADER */}

        <div className="mb-10">

          <p className="mb-2 text-sm font-medium text-pink-400">
            YOUR VIBE
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            Music
          </h1>

          <p className="mt-2 text-zinc-400">
            Pick a song and let the vibe speak.
          </p>

        </div>

        {/* UPLOAD SECTION */}

        <section className="mb-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">

          <div className="mb-6">

            <h2 className="text-xl font-semibold">
              Add a song
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              Upload an audio file to your playlist.
            </p>

          </div>

          <form
            onSubmit={uploadSong}
            className="grid gap-4 md:grid-cols-2"
          >

            {/* TITLE */}

            <input
              type="text"
              placeholder="Song title"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none placeholder:text-zinc-600 focus:border-pink-500"
            />

            {/* ARTIST */}

            <input
              type="text"
              placeholder="Artist"
              value={artist}
              onChange={(e) =>
                setArtist(e.target.value)
              }
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none placeholder:text-zinc-600 focus:border-pink-500"
            />

            {/* GENRE */}

            <input
              type="text"
              placeholder="Genre (Romantic, Garba, Chill...)"
              value={genre}
              onChange={(e) =>
                setGenre(e.target.value)
              }
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none placeholder:text-zinc-600 focus:border-pink-500"
            />

            {/* FILE */}

            <input
              id="song-file"
              type="file"
              accept="audio/*"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-pink-500 file:px-4 file:py-2 file:font-medium file:text-white"
            />

            {/* BUTTON */}

            <button
              type="submit"
              disabled={uploading}
              className="rounded-xl bg-pink-500 px-5 py-3 font-semibold transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
            >
              {uploading
                ? "Uploading..."
                : "Upload Song"}
            </button>

          </form>

          {message && (
            <p className="mt-4 text-sm text-zinc-300">
              {message}
            </p>
          )}

        </section>

        {/* SONG LIST */}

        <section>

          <div className="mb-5 flex items-center justify-between">

            <h2 className="text-xl font-semibold">
              Playlist
            </h2>

            <span className="text-sm text-zinc-500">
              {songs.length} songs
            </span>

          </div>

          {songs.length === 0 ? (

            <div className="rounded-3xl border border-dashed border-white/10 py-16 text-center">

              <div className="mb-3 text-4xl">
                🎵
              </div>

              <p className="font-medium">
                Your playlist is empty
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Upload your first song above.
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {songs.map((song, index) => {

                const active =
                  currentSong?.id === song.id;

                return (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => playSong(song)}
                    className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-pink-500/40 bg-pink-500/10"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                    }`}
                  >

                    {/* NUMBER */}

                    <div className="w-6 text-center text-sm text-zinc-500">
                      {active && isPlaying
                        ? "♫"
                        : index + 1}
                    </div>

                    {/* COVER */}

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-xl">
                      🎵
                    </div>

                    {/* INFO */}

                    <div className="min-w-0 flex-1">

                      <p
                        className={`truncate font-medium ${
                          active
                            ? "text-pink-400"
                            : "text-white"
                        }`}
                      >
                        {song.title}
                      </p>

                      <p className="mt-1 truncate text-sm text-zinc-500">
                        {song.artist || "Unknown artist"}
                        {song.genre
                          ? ` • ${song.genre}`
                          : ""}
                      </p>

                    </div>

                    {/* PLAY */}

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">

                      {active && isPlaying ? (
                        <span>Ⅱ</span>
                      ) : (
                        <span className="ml-0.5">
                          ▶
                        </span>
                      )}

                    </div>

                  </button>
                );
              })}

            </div>

          )}

        </section>

      </div>

      {/* BOTTOM PLAYER */}

      {currentSong && (

        <div className="sticky bottom-0 border-t border-white/10 bg-[#111113]/95 px-5 py-5 backdrop-blur-xl">

          <div className="mx-auto max-w-6xl">

            {/* SONG INFO */}

            <div className="mb-4 flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-xl">
                🎵
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate font-semibold">
                  {currentSong.title}
                </p>

                <p className="truncate text-sm text-zinc-500">
                  {currentSong.artist ||
                    "Unknown artist"}
                </p>

              </div>

            </div>

            {/* PROGRESS */}

            <div className="flex items-center gap-3">

              <span className="w-10 text-right text-xs text-zinc-500">
                {formatTime(currentTime)}
              </span>

              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="h-1 flex-1 cursor-pointer accent-pink-500"
              />

              <span className="w-10 text-xs text-zinc-500">
                {formatTime(duration)}
              </span>

            </div>

            {/* CONTROLS */}

            <div className="mt-4 flex items-center justify-center gap-4">

              {/* PREVIOUS */}

              <button
                type="button"
                onClick={previousSong}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                aria-label="Previous song"
              >
                ◀◀
              </button>

              {/* PLAY */}

              <button
                type="button"
                onClick={togglePlay}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-500 text-xl transition hover:bg-pink-400"
                aria-label={
                  isPlaying
                    ? "Pause song"
                    : "Play song"
                }
              >
                {isPlaying ? "Ⅱ" : "▶"}
              </button>

              {/* NEXT */}

              <button
                type="button"
                onClick={nextSong}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                aria-label="Next song"
              >
                ▶▶
              </button>

            </div>

            {/* VOLUME */}

            <div className="mt-4 flex items-center justify-end gap-3">

              <span className="text-sm">
                🔊
              </span>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolume}
                className="w-28 accent-pink-500"
                aria-label="Volume"
              />

            </div>

          </div>

        </div>

      )}

    </main>
  );
}
