let mapAlreadyDrawn = false;

document.addEventListener("DOMContentLoaded", () => {

  function showPage(name) {
    document.querySelectorAll(".page").forEach(el => {
      el.style.display = (el.dataset.page === name) ? "block" : "none";
    });

    document.querySelectorAll(".navlinks a").forEach(a => {
      a.classList.toggle("active", a.dataset.page === name);
    });

    if (name === "map" && !mapAlreadyDrawn) {
      mapAlreadyDrawn = true;
      renderPreciseAfricaMap((pageName) => {
        window.location.hash = pageName;
        showPage(pageName);
      });
    }
  }

  function pageFromHash() {
    const hash = (window.location.hash || "#home").replace("#", "").trim();
    const valid = ["home","map","mozambique","south-africa","kenya","madagascar","seychelles","reunion"];
    return valid.includes(hash) ? hash : "home";
  }

  document.querySelectorAll(".navlinks a").forEach(a => {
    a.addEventListener("click", () => {
      window.location.hash = a.dataset.page;
    });
  });

  window.addEventListener("hashchange", () => showPage(pageFromHash()));
  showPage(pageFromHash());
});

async function renderPreciseAfricaMap(openPage) {
  const container = document.getElementById("africaMap");
  if (!container) return;

  container.innerHTML = "";

  const clickableById = new Map([
    [404, "kenya"],
    [450, "madagascar"],
    [508, "mozambique"],
    [710, "south-africa"],
  ]);

  const fallbackNameById = new Map([
    [404, "Kenya"],
    [450, "Madagascar"],
    [508, "Mozambique"],
    [710, "South Africa"],
  ]);

  const topoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
  const namesUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.tsv";

  const topology = await fetch(topoUrl).then(r => r.json());

  let tsvText = "";
  try { tsvText = await fetch(namesUrl).then(r => r.text()); } catch (e) {}

  const nameById = new Map();
  if (tsvText.trim()) {
    d3.tsvParse(tsvText).forEach(d => nameById.set(d.id, d.name));
  }

  const countries = topojson.feature(topology, topology.objects.countries).features;

  countries.forEach(f => {
    const idNum = Number(f.id);
    f.properties.name = nameById.get(String(f.id)) || fallbackNameById.get(idNum) || "";
  });

  const width = 900, height = 650;

  const svg = d3.select(container).append("svg").attr("viewBox", `0 0 ${width} ${height}`);

  const projection = d3.geoMercator()
    .center([20, 5])
    .scale(430)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath(projection);

  svg.append("g")
    .selectAll("path")
    .data(countries)
    .join("path")
    .attr("d", path)
    .attr("class", d => clickableById.has(Number(d.id)) ? "map-country clickable" : "map-country")
    .on("click", (event, d) => {
      const page = clickableById.get(Number(d.id));
      if (page) openPage(page);
    })
    .append("title")
    .text(d => d.properties.name || "Unknown");

  const markers = [
    { name: "Seychelles", page: "seychelles", lon: 55.45, lat: -4.62 },
    { name: "Réunion", page: "reunion", lon: 55.54, lat: -21.12 }
  ];

  svg.append("g")
    .selectAll("circle")
    .data(markers)
    .join("circle")
    .attr("class", "map-marker")
    .attr("r", 6)
    .attr("cx", d => projection([d.lon, d.lat])[0])
    .attr("cy", d => projection([d.lon, d.lat])[1])
    .on("click", (event, d) => openPage(d.page))
    .append("title")
    .text(d => d.name);
}
