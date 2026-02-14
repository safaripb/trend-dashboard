// app.js
// K-pop only (Wikipedia page titles)
const TRACKS = [
  { label: "BTS — Dynamite", title: "Dynamite_(BTS_song)" },
  { label: "BLACKPINK — How You Like That", title: "How_You_Like_That" },
  { label: "NewJeans — Super Shy", title: "Super_Shy" },
  { label: "IVE — Love Dive", title: "Love_Dive" },
];

const PALETTE = ["#5A9CB5", "#FACE68", "#FAAC68", "#FA6868"];

const els = {
  trackSelect: document.getElementById("trackSelect"),
  rangeSelect: document.getElementById("rangeSelect"),
  refreshBtn: document.getElementById("refreshBtn"),
  statusText: document.getElementById("statusText"),
  canvas: document.getElementById("trendChart"),
};

function setStatus(msg){ els.statusText.textContent = msg; }

function yyyymmdd(date){
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function prettyDate(s){
  return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
}

async function fetchPageviews(title, days){
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  const url =
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/` +
    `en.wikipedia/all-access/user/${encodeURIComponent(title)}/daily/` +
    `${yyyymmdd(start)}/${yyyymmdd(end)}`;

  const res = await fetch(url);
  if(!res.ok) throw new Error(`API failed (${res.status}) for ${title}`);

  const data = await res.json();
  return data.items.map(it => ({ date: it.timestamp.slice(0,8), views: it.views }));
}

let chart;

function renderChart(labels, values, seriesLabel){
  if(chart) chart.destroy();

  const color = PALETTE[els.trackSelect.value % PALETTE.length];

  chart = new Chart(els.canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        /* glow line behind */
        {
          label: "glow",
          data: values,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 10,
          borderColor: hexToRgba(color, 0.18),
          fill: false,
        },
        /* main line */
        {
          label: seriesLabel,
          data: values,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 3,
          borderColor: color,
          backgroundColor: hexToRgba(color, 0.14),
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }, // less text
        tooltip: { mode: "index", intersect: false },
      },
      interaction: { mode: "index", intersect: false },
      scales: {
        y: {
          grid: { color: "rgba(0,0,0,0.06)" },
          ticks: {
            maxTicksLimit: 4, // fewer numbers
            callback: (v) => (v >= 1000 ? `${Math.round(v/1000)}k` : v),
          },
          title: { display: false },
        },
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 6 }, // fewer labels
          title: { display: false },
        },
      },
    },
  });
}

function hexToRgba(hex, a){
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0,2), 16);
  const g = parseInt(h.slice(2,4), 16);
  const b = parseInt(h.slice(4,6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

async function loadAndPlot(){
  const track = TRACKS[Number(els.trackSelect.value)];
  const days = Number(els.rangeSelect.value);

  try{
    setStatus("Loading…");
    const pts = await fetchPageviews(track.title, days);

    const labels = pts.map(p => prettyDate(p.date));
    const values = pts.map(p => p.views);

    renderChart(labels, values, track.label);
    setStatus("Updated.");
  }catch(err){
    setStatus(`Error: ${err.message}`);
  }
}

function init(){
  TRACKS.forEach((t, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = t.label;
    els.trackSelect.appendChild(opt);
  });

  els.refreshBtn.addEventListener("click", loadAndPlot);
  els.trackSelect.addEventListener("change", loadAndPlot);
  els.rangeSelect.addEventListener("change", loadAndPlot);

  loadAndPlot();
}

init();
