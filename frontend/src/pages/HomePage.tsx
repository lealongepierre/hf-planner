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
    <div className="flex flex-col justify-center items-center py-12 px-4">
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8">
          🔥 Hellfest 2026 🔥
        </h1>

        <div className="bg-gradient-to-br from-red-50 to-gray-100 rounded-lg p-12 border-4 border-red-600 shadow-2xl">
          <div className="text-8xl md:text-9xl font-black text-red-600 mb-4 tracking-tight">
            J-{daysUntil}
          </div>
          <div className="text-2xl md:text-3xl text-gray-800 font-semibold">
            {daysUntil === 0 ? (
              "C'est aujourd'hui !"
            ) : daysUntil === 1 ? (
              "Demain, ça commence !"
            ) : (
              `${daysUntil} jours avant le festival`
            )}
          </div>
          <div className="mt-6 text-xl text-gray-600">
            18 - 21 juin 2026
          </div>
        </div>

        <div className="mt-12 text-gray-600 text-lg font-medium">
          Clisson, France 🇫🇷
        </div>
      </div>
    </div>
  );
}
