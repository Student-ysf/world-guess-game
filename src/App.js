import React, { useState, useEffect, useRef } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import countries from "./data/countries.json";
import "./App.css";
import topoData from "./data/countries-custom.json";
import { feature } from "topojson-client";

// تحويل TopoJSON إلى GeoJSON
const geoJsonData = feature(topoData, topoData.objects.countries);

const normalize = (str = "") =>
  str
    .toLowerCase()
    .replace(/[\s'-]/g, "")
    .replace(/[éèêë]/g, "e")
    .replace(/[áàâä]/g, "a")
    .replace(/[íìîï]/g, "i")
    .replace(/[óòôö]/g, "o")
    .replace(/[úùûü]/g, "u");

function App() {
  const [found, setFound] = useState([]);
  const [timeLeft, setTimeLeft] = useState(900);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [performanceText, setPerformanceText] = useState("");

  // لإدارة الصوت
  const audioRef = useRef(null);

  const checkCountry = (value) => {
    if (gameOver || !gameStarted) return;
    const trimmed = (value || "").trim();
    if (!trimmed) return;

    const txt = normalize(trimmed);
    const match = countries.find(
      (c) =>
        normalize(c.name) === txt ||
        (c.aliases && c.aliases.some((a) => normalize(a) === txt))
    );

    if (match && !found.some((f) => normalize(f) === normalize(match.name))) {
      setFound((prev) => [...prev, match.name]);
      try {
        const correctAudio = new Audio("/correct.mp3");
        correctAudio.play().catch(() => {});
      } catch (e) {}
      setInputValue("");
    }
  };

  useEffect(() => {
    if (!gameStarted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted]);

  const playPerformanceAudio = (performance) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    let audioPath = "";
    if (performance.includes("ممتاز")) audioPath = "/wooww.mp3";
    else if (performance.includes("جيد")) audioPath = "/not-bad-not-bad.mp3";
    else audioPath = "/tb-lk.mp3";

    audioRef.current = new Audio(audioPath);
    audioRef.current.play().catch(() => {});
  };

  const endGame = () => {
    setGameOver(true);
    const percent = (found.length / countries.length) * 100;
    let performance = "";

    if (percent >= 90) performance = "ممتاز 🌟";
    else if (percent >= 70) performance = "جيد 👍";
    else performance = "ضعيف ❌";

    setPerformanceText(performance);
    setShowResult(true);

    playPerformanceAudio(performance);
  };

  const resetGame = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setFound([]);
    setTimeLeft(900);
    setGameOver(false);
    setGameStarted(false);
    setInputValue("");
    setShowResult(false);
    setPerformanceText("");
  };

  const startGame = () => {
    try {
      const startAudio = new Audio("/start.mp3"); // صوت البداية
      startAudio.play().catch(() => {});
    } catch (e) {}

    setFound([]);
    setTimeLeft(900);
    setGameOver(false);
    setGameStarted(true);
    setInputValue("");
    setShowResult(false);
    setPerformanceText("");
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

  return (
    <div>
      {!gameStarted ? (
        <div className="start-screen">
          <h1 className="start-title animate-title">🌍 لعبة تخمين الدول</h1>
          <img src="/pngegg.png" alt="كرة الأرض تدور" className="start-gif animate-gif" />
          <button onClick={startGame} className="start-button">
            ابدأ اللعبة
          </button>
          <p className="start-desc">
           ! اختبر معرفتك بجغرافيا العالم 🌎  واكتب أسماء الدول بسرعة قبل انتهاء الوقت
          </p>
        </div>
      ) : (
        <div className="container">
          <div className="left-panel">
            <div>
              <h1 className="title">لعبة تخمين الدول</h1>
              <h2 className="timer">الوقت المتبقي: {formatTime(timeLeft)}</h2>

              {!gameOver && (
                <input
                  id="countryInput"
                  className="country-input"
                  placeholder="اكتب اسم دولة أو الاختصار واضغط Enter..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") checkCountry(inputValue);
                  }}
                  autoFocus
                />
              )}

              <div className="map-container">
                <ComposableMap
                  projectionConfig={{ scale: 100 }}
                  width={600}
                  height={300}
                  className="map"
                >
                  <Geographies geography={geoJsonData}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const geoName = geo.properties.name;
                        const isFound = found.some(
                          (f) => normalize(f) === normalize(geoName)
                        );
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

              <div className="attempts">
                <h3>محاولاتك: {found.length} دولة</h3>
              </div>
            </div>
          </div>

          <div className="right-panel">
            {continents.map((continent) => (
              <div key={continent} className="continent-panel">
                <h3>{continent}</h3>
                <div className="continent-grid">
                  {getCountriesByContinent(continent).map((c) => {
                    const isFound = found.some(
                      (f) => normalize(f) === normalize(c.name)
                    );
                    return (
                      <div
                        key={c.name}
                        className={`country-cell ${isFound ? "found" : ""}`}
                      >
                        {isFound ? c.name : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* واجهة النتيجة */}
          {showResult && (
            <div className="result-overlay">
              <div className="result-box">
                <h2>انتهت اللعبة!</h2>
                <p>أداؤك: {performanceText}</p>
                <p>لقد اكتشفت {found.length} من {countries.length} دولة.</p>
                <button className="reset-button" onClick={resetGame}>إعادة اللعب</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
