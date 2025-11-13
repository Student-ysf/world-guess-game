import React, { useState, useEffect } from "react";
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
        const audio = new Audio("/correct.mp3");
        audio.play().catch(() => {});
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
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted]);

  const resetGame = () => {
    setFound([]);
    setTimeLeft(900);
    setGameOver(false);
    setGameStarted(false);
    setInputValue("");
  };

  const startGame = () => {
    setFound([]);
    setTimeLeft(900);
    setGameOver(false);
    setGameStarted(true);
    setInputValue("");
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

  const getPerformance = () => {
    const percent = (found.length / countries.length) * 100;
    if (percent >= 90) return "ممتاز 🌟";
    if (percent >= 70) return "جيد 👍";
    if (percent >= 40) return "متوسط ⚡";
    return "ضعيف ❌";
  };

  return (
    <div style={{ display: "flex", padding: 20, fontFamily: "Arial, sans-serif" }}>
      {!gameStarted ? (
        // ===== واجهة البداية =====
        <div
          style={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            backgroundColor: "#27DDF5",
          }}
        >
          <h1
            style={{
              fontSize: "40px",
              color: "white",
              textShadow: "2px 2px 8px rgba(0,0,0,0.4)",
              marginBottom: "30px",
            }}
          >
            🌍 لعبة تخمين الدول
          </h1>

          {/* صورة GIF */}
          <img
            src="/pngegg.png"
            alt="Earth rotating"
            style={{
              width: "300px",
              height: "300px",
              objectFit: "contain",
              background: "transparent",
              marginBottom: "40px",
            }}
          />

          {/* زر البدء */}
          <button
            onClick={startGame}
            style={{
              padding: "12px 30px",
              fontSize: "18px",
              backgroundColor: "#ffeb3b",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
            }}
          >
            ابدأ اللعبة
          </button>
        </div>
      ) : (
        // ===== واجهة اللعبة =====
        <>
          <div style={{ flex: 2 }}>
            <h1>لعبة تخمين الدول</h1>

            {gameStarted && <h2>الوقت المتبقي: {formatTime(timeLeft)}</h2>}

            {!gameOver && (
              <input
                id="countryInput"
                placeholder="اكتب اسم دولة أو الاختصار واضغط Enter..."
                style={{ padding: "6px", width: "50%", fontSize: 14 }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    checkCountry(inputValue);
                  }
                }}
                autoFocus
              />
            )}

            {gameOver && (
              <button
                onClick={resetGame}
                style={{ padding: "10px 20px", fontSize: 16, marginTop: 10 }}
              >
                إعادة اللعب
              </button>
            )}

            <div
              style={{
                padding: "10px",
                border: "3px solid #fff",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                marginTop: 20,
                marginLeft: "-20px",
              }}
            >
              <ComposableMap
                projectionConfig={{ scale: 100 }}
                width={600}
                height={300}
                style={{ width: "100%", height: "auto" }}
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

            <div style={{ marginTop: 20 }}>
              <h3>محاولاتك: {found.length} دولة</h3>
              <h3>تقييم محاولاتك: {getPerformance()}</h3>
            </div>
          </div>

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
                  {getCountriesByContinent(continent).map((c) => {
                    const isFound = found.some(
                      (f) => normalize(f) === normalize(c.name)
                    );
                    return (
                      <div
                        key={c.name}
                        style={{
                          height: "30px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isFound ? "#2ecc71" : "#eee",
                          border: "1px solid #ccc",
                          fontSize: 12,
                        }}
                      >
                        {isFound ? c.name : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
