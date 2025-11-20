import { useState, useEffect } from 'react';

export function HomePage() {
  const [daysUntil, setDaysUntil] = useState<number>(0);

  useEffect(() => {
    const calculateDaysUntil = () => {
      const festivalDate = new Date('2026-06-18T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = festivalDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setDaysUntil(diffDays);
    };

    calculateDaysUntil();
    const interval = setInterval(calculateDaysUntil, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex flex-col justify-center items-center px-4">
      <div className="text-center">
        <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-8">
          🔥 Hellfest 2026 🔥
        </h1>

        <div className="bg-black bg-opacity-50 rounded-lg p-12 backdrop-blur-sm border-4 border-red-600 shadow-2xl">
          <div className="text-9xl md:text-[12rem] font-black text-red-500 mb-4 tracking-tight">
            J-{daysUntil}
          </div>
          <div className="text-2xl md:text-3xl text-gray-300 font-semibold">
            {daysUntil === 0 ? (
              "C'est aujourd'hui !"
            ) : daysUntil === 1 ? (
              "Demain, ça commence !"
            ) : (
              `${daysUntil} jours avant le festival`
            )}
          </div>
          <div className="mt-6 text-xl text-gray-400">
            18 - 21 juin 2026
          </div>
        </div>

        <div className="mt-12 text-gray-400 text-lg">
          Clisson, France 🇫🇷
        </div>
      </div>
    </div>
  );
}
