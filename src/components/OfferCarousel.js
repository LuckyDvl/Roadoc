import { useState, useEffect } from "react";

export default function OfferCarousel() {
  const [currentOffer, setCurrentOffer] = useState(0);

  const offers = [
    "20% off on first service",
    "Free pickup for nearby repairs",
    "Flat ₹100 off on emergency booking"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentOffer((prev) => (prev + 1) % offers.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden px-4">
      <div className="bg-yellow-300 p-4 rounded-xl text-center font-semibold transition-all duration-700 transform hover:scale-[1.02]">
        {offers[currentOffer]}
      </div>
    </div>
  );
}
