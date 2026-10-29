
const STORAGE_KEY = "floodroute_demo_reports";

const sampleReports = [
  {
    id: "sample-1",
    roadName: "Demo Road A",
    hazardType: "Flooded road",
    severity: "High - possible danger",
    details: "Sample marker for demonstration only.",
    lat: 26.4499,
    lng: 80.3319,
    status: "Unverified",
    createdAt: "Demo data"
  },
  {
    id: "sample-2",
    roadName: "Demo Road B",
    hazardType: "Road blockage",
    severity: "Moderate - travel disruption",
    details: "Sample marker for demonstration only.",
    lat: 26.4550,
    lng: 80.3450,
    status: "Unverified",
    createdAt: "Demo data"
  },
  {
    id: "sample-3",
    roadName: "Demo Information Point",
    hazardType: "Other hazard",
    severity: "Unknown - needs assessment",
    details: "Example information point, not a verified safe location.",
    lat: 26.4380,
    lng: 80.3200,
    status: "Unverified",
    createdAt: "Demo data"
  }
];

const form = document.getElementById("report-form");
const reportNameInput = document.getElementById("road-name");
const hazardInput = document.getElementById("hazard-type");
const severityInput = document.getElementById("severity");
const detailsInput = document.getElementById("report-details");
const formMessage = document.getElementById("form-message");
const reportsList = document.getElementById("reports-list");
const reportCount = document.getElementById("report-count");
const resetMapButton = document.getElementById("reset-map");

let map = null;
let markerLayer = null;

function loadReports() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read saved reports:", error);
    return [];
  }
}

function saveReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    return true;
  } catch (error) {
    console.error("Could not save reports:", error);
    return false;
  }
}

function getAllReports() {
  return [...loadReports(), ...sampleReports];
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return entities[character];
  });
}

function formatDate(value) {
  if (value === "Demo data") return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently submitted";

  return date.toLocaleString();
}

function renderReports() {
  const reports = getAllReports();

  reportCount.textContent =
    reports.length + (reports.length === 1 ? " report" : " reports");

  if (reports.length === 0) {
    reportsList.innerHTML =
      '<p class="empty-state">No reports yet. Submit a demo report to see it here.</p>';
    return;
  }

  reportsList.innerHTML = reports.map(function (report) {
    return `
      <article class="report-item">
        <div>
          <h4>${escapeHTML(report.roadName)}</h4>
          <p>${escapeHTML(report.hazardType)} · ${escapeHTML(report.severity)}</p>
          ${report.details ? `<p>${escapeHTML(report.details)}</p>` : ""}
          <small>${escapeHTML(formatDate(report.createdAt))}</small>
        </div>
        <span class="report-status">${escapeHTML(report.status || "Unverified")}</span>
      </article>
    `;
  }).join("");
}

function addMarker(report) {
  if (!map || !markerLayer) return;

  if (
    typeof report.lat !== "number" ||
    typeof report.lng !== "number"
  ) {
    return;
  }

  const marker = L.circleMarker([report.lat, report.lng], {
    radius: 8,
    color: "#ffffff",
    weight: 2,
    fillColor: report.status === "Unverified" ? "#d89124" : "#d94a4a",
    fillOpacity: 1
  });

  const popupContent = `
    <strong>${escapeHTML(report.roadName)}</strong><br>
    ${escapeHTML(report.hazardType)}<br>
    Severity: ${escapeHTML(report.severity)}<br>
    Status: ${escapeHTML(report.status || "Unverified")}<br>
    <small>Demo information only. Verify road conditions with official sources.</small>
  `;

  marker.bindPopup(popupContent);
  marker.addTo(markerLayer);
}

function refreshMapMarkers() {
  if (!map || !markerLayer) return;

  markerLayer.clearLayers();
  getAllReports().forEach(addMarker);
}

function initialiseMap() {
  const mapElement = document.getElementById("map");

  if (!mapElement || typeof L === "undefined") {
    if (mapElement) {
      mapElement.innerHTML =
        '<p style="padding:20px">The map could not load. Check your internet connection and reload the page.</p>';
    }
    return;
  }

  map = L.map("map").setView([26.4499, 80.3319], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);
  refreshMapMarkers();

  if (resetMapButton) {
    resetMapButton.addEventListener("click", function () {
      map.setView([26.4499, 80.3319], 12);
    });
  }
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const roadName = reportNameInput.value.trim();
  const hazardType = hazardInput.value;
  const severity = severityInput.value;
  const details = detailsInput.value.trim();

  if (!roadName || !hazardType || !severity) {
    formMessage.textContent = "Please complete all required fields.";
    return;
  }

  const reports = loadReports();

  const newReport = {
    id: Date.now().toString(),
    roadName: roadName,
    hazardType: hazardType,
    severity: severity,
    details: details,
    status: "Unverified",
    createdAt: new Date().toISOString()
  };

  reports.unshift(newReport);

  if (!saveReports(reports)) {
    formMessage.textContent =
      "Could not save the report in this browser. Please try again.";
    return;
  }

  form.reset();
  formMessage.textContent =
    "Demo report saved locally. It is unverified and has not been sent to authorities.";

  renderReports();
  refreshMapMarkers();
});

renderReports();
initialiseMap();
