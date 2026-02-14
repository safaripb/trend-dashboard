const TRACKS = [
  // Using Wikipedia page titles (underscores OK)
  { label: "Blinding Lights — The Weeknd", title: "Blinding_Lights" },
  { label: "As It Was — Harry Styles", title: "As_It_Was" },
  { label: "Flowers — Miley Cyrus", title: "Flowers_(Miley_Cyrus_song)" },
  { label: "Espresso — Sabrina Carpenter", title: "Espresso_(song)" },
];

const els = {
  trackSelect: document.getElementById("trackSelect"),
  rangeSelect: document.getElementById("rangeSelect"),
  refreshBtn: document.getElementById("refreshBtn"),
  statusText: document.getElementById("statusText"),
  canvas: document.getElementById("trendChart"),
};

function setStatus(msg) {
  els.statusText.textContent = msg;
}

function yyyymmdd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

async function fetchPageviews(title, days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  const startS = yyyymmdd(start);
  const endS = yyyymmdd(end);

  const encoded = encodeURIComponent(title);
  const url =
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/` +
    `en.wikipedia/all-access/user/${encoded}/daily/${startS}/${endS}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API failed (${res.status}) for ${title}`);
  }
  const data = await res.json();
  return data.items.map(it => ({
    date: it.timestamp.slice(0, 8),
    views: it.views,
  }));
}

function prettyDate(yyyymmddStr) {
  const y = yyyymmddStr.slice(0, 4);
  const m = yyyymmddStr.slice(4, 6);
  const d = yyyymmddStr.slice(6, 8);
  return `${y}-${m}-${d}`;
}

let chart;

function renderChart(labels, values, seriesLabel) {
  if (chart) chart.destroy();

  chart = new Chart(els.canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: seriesLabel,
          data: values,
          tension: 0.25,
          pointRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: { mode: "index", intersect: false },
      },
      interaction: { mode: "index", intersect: false },
      scales: {
        y: { title: { display: true, text: "Daily pageviews" } },
        x: { title: { display: true, text: "Date" } },
      },
    },
  });
}

async function loadAndPlot() {
  const track = TRACKS[els.trackSelect.value];
  const days = Number(els.rangeSelect.value);

  try {
    setStatus(`Loading data for: ${track.label}...`);
    const pts = await fetchPageviews(track.title, days);

    const labels = pts.map(p => prettyDate(p.date));
    const values = pts.map(p => p.views);

    renderChart(labels, values, track.label);

    // quick “insight”
    const max = Math.max(...values);
    const maxIdx = values.indexOf(max);
    setStatus(`Done. Biggest spike: ${labels[maxIdx]} with ${max.toLocaleString()} views.`);
  } catch (err) {
    setStatus(`Error: ${err.message}`);
  }
}

function init() {
  // fill dropdown
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
