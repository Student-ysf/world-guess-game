// src/App.js
import React, { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import countries from "./data/countries.json";
import "./App.css";

function App() {
  const [found, setFound] = useState([]);
  const [timeLeft, setTimeLeft] = useState(900); // 15 دقيقة
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false); // هل بدأ اللعب؟

  const checkCountry = (value) => {
    if (gameOver || !gameStarted) return;

    const txt = value.toLowerCase().trim();
    const match = countries.find(
      (c) =>
        c.name.toLowerCase() === txt ||
        (c.aliases && c.aliases.some((a) => a.toLowerCase() === txt))
    );

    if (match && !found.includes(match.name)) {
      setFound([...found, match.name]);
      const audio = new Audio("/correct.mp3");
      audio.play();
      document.getElementById("countryInput").value = "";
    }
  };

  // العد التنازلي
  useEffect(() => {
    if (!gameStarted) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, gameStarted]);

  const resetGame = () => {
    setFound([]);
    setTimeLeft(900);
    setGameOver(false);
    setGameStarted(false);
  };

  const getCountriesByContinent = (continent) =>
    countries
      .filter((c) => c.continent === continent)
      .sort((a, b) => a.name.localeCompare(b.name));

  const continents = [
    "Africa",
    "Asia",
    "Europe",
    "North America",
    "South America",
    "Oceania",
  ];

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // تقييم الأداء بناءً على عدد الدول التي تم تخمينها
  const getPerformance = () => {
    const percent = (found.length / countries.length) * 100;
    if (percent >= 90) return "ممتاز 🌟";
    if (percent >= 70) return "جيد 👍";
    if (percent >= 40) return "متوسط ⚡";
    return "ضعيف ❌";
  };

  return (
    <div style={{ display: "flex", padding: 20, fontFamily: "Arial, sans-serif" }}>
      {/* الخريطة على اليسار */}
      <div style={{ flex: 2 }}>
        <h1>لعبة تخمين الدول</h1>

        {/* زر البداية */}
        {!gameStarted && (
          <button
            onClick={() => setGameStarted(true)}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              backgroundColor: "yellow",
              border: "1px solid #ccc",
              cursor: "pointer",
              marginBottom: 20,
            }}
          >
            ابدأ اللعبة
          </button>
        )}

        {/* العد التنازلي */}
        {gameStarted && <h2>الوقت المتبقي: {formatTime(timeLeft)}</h2>}

        {/* خانة إدخال الدولة */}
        {gameStarted && !gameOver && (
          <input
            id="countryInput"
            placeholder="اكتب اسم دولة أو الاختصار..."
            style={{ padding: "6px", width: "50%", fontSize: 14 }}
            onChange={(e) => checkCountry(e.target.value)}
            autoFocus
          />
        )}

        {/* زر إعادة اللعب بعد انتهاء الوقت */}
        {gameOver && (
          <button
            onClick={resetGame}
            style={{ padding: "10px 20px", fontSize: 16, marginTop: 10 }}
          >
            إعادة اللعب
          </button>
        )}

        {/* الخريطة داخل إطار */}
        {gameStarted && (
          <div
            style={{
              padding: "10px",
              border: "3px solid #fff",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
              marginTop: 20,
              marginLeft: "-20px", // زحزحة لليسار
            }}
          >
            <ComposableMap
              projectionConfig={{ scale: 100 }}
              width={600}
              height={300}
              style={{ width: "100%", height: "auto" }}
            >
              <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const isFound = found.includes(geo.properties.name);
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={isFound ? "#2ecc71" : "#DDD"}
                        stroke="#000"
                        strokeWidth={0.5}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>
        )}

        {/* محاولاتك وتقييمك تحت الخريطة */}
        {gameStarted && (
          <div style={{ marginTop: 20 }}>
            <h3>محاولاتك: {found.length} دولة</h3>
            <h3>تقييم محاولاتك: {getPerformance()}</h3>
          </div>
        )}
      </div>

      {/* تابلو القارات على اليمين */}
      {gameStarted && (
        <div style={{ flex: 1, marginLeft: 20 }}>
          {continents.map((continent) => (
            <div key={continent} style={{ marginBottom: 20 }}>
              <h3>{continent}</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "5px",
                  border: "1px solid #ccc",
                  padding: "5px",
                }}
              >
                {getCountriesByContinent(continent).map((c) => (
                  <div
                    key={c.name}
                    style={{
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: found.includes(c.name) ? "#2ecc71" : "#eee",
                      border: "1px solid #ccc",
                      fontSize: 12,
                    }}
                  >
                    {found.includes(c.name) ? c.name : ""}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
