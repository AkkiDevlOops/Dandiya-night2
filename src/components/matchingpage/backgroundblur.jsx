"use client"
import React, { useState, useEffect } from "react";
import Image from "next/image";

export default function SlideshowDiv() {
  const images = [
    "/image1.png",
    "/image2.png",
    "/image3.png",
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className=" ">
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 min-h-screen transition-opacity  duration-700 ease-in-out ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={img}
            alt={`Slide ${index + 1}`}
            fill
            className="object-cover"
          />
        </div>
      ))}

      {/* Indicator Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {images.map((_, index) => (
          <span
            key={index}
            className={`h-2  transition-all duration-300 ${
              index === currentIndex ? "w-6 bg-white" : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}