import React, { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import countries from "./data/countries.json";
import "./App.css";

// دالة توحيد النصوص (لتفادي مشاكل المسافات والعلامات)
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
  const [geoNames, setGeoNames] = useState([]); // أسماء الدول في الخريطة

  // ✅ طباعة أسماء الدول الموجودة في الخريطة
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((res) => res.json())
      .then(async (worldData) => {
        const topojson = await import("topojson-client");
        const geojson = topojson.feature(
          worldData,
          worldData.objects.countries
        );
        const names = geojson.features.map((f) => f.properties.name);
        setGeoNames(names);
        console.log("✅ أسماء الدول في الخريطة:", names);
      });
  }, []);

  // ✅ البحث الذكي عن الدولة
  const checkCountry = (value) => {
    if (gameOver || !gameStarted) return;
    const trimmed = (value || "").trim();
    if (!trimmed) return;

    const txt = normalize(trimmed);

    // محاولة المطابقة مع الدول في ملف countries.json
    let match = countries.find(
      (c) =>
        normalize(c.name) === txt ||
        (c.aliases && c.aliases.some((a) => normalize(a) === txt)) ||
        normalize(c.name).includes(txt)
    );

    // إذا لم توجد مطابقة في JSON، نحاول مطابقة مباشرة مع أسماء الخريطة
    if (!match) {
      const geoMatch = geoNames.find(
        (name) => normalize(name) === txt || normalize(name).includes(txt)
      );
      if (geoMatch)
        match = { name: geoMatch, aliases: [], continent: "Unknown" };
    }

    if (match && !found.some((f) => normalize(f) === normalize(match.name))) {
      setFound((prev) => [...prev, match.name]);
      try {
        const audio = new Audio("/correct.mp3");
        audio.play().catch(() => {});
      } catch {}
      setInputValue("");
    }
  };

  // ⏱️ المؤقت
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
      <div style={{ flex: 2 }}>
        <h1>🌍 لعبة تخمين الدول</h1>

        {!gameStarted && (
          <button
            onClick={startGame}
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

        {gameStarted && <h2>⏱ الوقت المتبقي: {formatTime(timeLeft)}</h2>}

        {gameStarted && !gameOver && (
          <input
            id="countryInput"
            placeholder="اكتب اسم دولة أو اختصار واضغط Enter..."
            style={{ padding: "6px", width: "50%", fontSize: 14 }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkCountry(inputValue)}
            autoFocus
          />
        )}

        {gameOver && (
          <button
            onClick={resetGame}
            style={{ padding: "10px 20px", fontSize: 16, marginTop: 10 }}
          >
            🔁 إعادة اللعب
          </button>
        )}

        {gameStarted && (
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
              <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
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
        )}

        {gameStarted && (
          <div style={{ marginTop: 20 }}>
            <h3>✅ محاولاتك: {found.length} دولة</h3>
            <h3>📊 تقييمك: {getPerformance()}</h3>
          </div>
        )}
      </div>

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
      )}
    </div>
  );
}

export default App;