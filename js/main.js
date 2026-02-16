/* ============================================================
   Midland Project — Main JavaScript
   Loads events from JSON, videos from YAML, and handles UI.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  loadEvents();
  loadVideos();
  initMobileMenu();
});

/* ============================================================
   EVENTS — Load from data/events.json
   ============================================================ */

/**
 * Month abbreviations in German.
 */
const MONTHS_DE = [
  "JAN", "FEB", "MÄR", "APR", "MAI", "JUN",
  "JUL", "AUG", "SEP", "OKT", "NOV", "DEZ"
];

/**
 * Load events from the JSON data file and render them.
 */
async function loadEvents() {
  const container = document.getElementById("eventsList");
  if (!container) return;

  try {
    const response = await fetch("data/events.json");
    if (!response.ok) throw new Error("Events konnten nicht geladen werden.");
    const events = await response.json();

    // Sort events by date ascending
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter only upcoming events (today or later)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = events.filter(e => new Date(e.date) >= today);

    if (upcoming.length === 0) {
      container.innerHTML = '<p class="no-events">Keine kommenden Events geplant. Schau bald wieder vorbei!</p>';
      return;
    }

    // Render each event row
    container.innerHTML = upcoming.map(event => renderEventRow(event)).join("");
  } catch (err) {
    console.error("Fehler beim Laden der Events:", err);
    container.innerHTML = '<p class="no-events">Events konnten nicht geladen werden.</p>';
  }
}

/**
 * Render a single event row HTML.
 */
function renderEventRow(event) {
  const date = new Date(event.date);
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS_DE[date.getMonth()];
  const year = date.getFullYear();

  // Build ticket button only if link exists
  const ticketBtn = event.ticketLink
    ? `<a href="${event.ticketLink}" target="_blank" rel="noopener" class="btn-event">Tickets</a>`
    : "";

  return `
    <div class="event-row">
      <div class="event-date">
        <div class="event-date-day">${day}</div>
        <div class="event-date-month">${month} ${year}</div>
      </div>
      <div class="event-separator"></div>
      <div class="event-details">
        <div class="event-title">${escapeHTML(event.title)}</div>
        <div class="event-description">${escapeHTML(event.description || "")}</div>
        <div class="event-location">${escapeHTML(event.venue)} · ${escapeHTML(event.location)}</div>
      </div>
      <div class="event-actions">
        ${ticketBtn}
      </div>
    </div>
  `;
}

/* ============================================================
   VIDEOS — Load from data/videos.yaml (simple parsing)
   ============================================================ */

/**
 * Load videos from the YAML data file and render them.
 */
async function loadVideos() {
  const container = document.getElementById("videosGrid");
  if (!container) return;

  try {
    const response = await fetch("data/videos.yaml");
    if (!response.ok) throw new Error("Videos konnten nicht geladen werden.");
    const text = await response.text();
    const videos = parseSimpleYAML(text);

    if (videos.length === 0) {
      container.innerHTML = '<p class="no-events">Keine Videos verfügbar.</p>';
      return;
    }

    // Render each video card
    container.innerHTML = videos.map(video => renderVideoCard(video)).join("");
  } catch (err) {
    console.error("Fehler beim Laden der Videos:", err);
    container.innerHTML = '<p class="no-events">Videos konnten nicht geladen werden.</p>';
  }
}

/**
 * Parse a simple YAML list of videos.
 * Expects entries with `id` and `title` fields.
 */
function parseSimpleYAML(yamlText) {
  const videos = [];
  const lines = yamlText.split("\n");
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith("#") || trimmed === "" || trimmed === "videos:") {
      continue;
    }

    // New entry
    if (trimmed.startsWith("- id:")) {
      if (current) videos.push(current);
      current = { id: extractYAMLValue(trimmed.replace("- id:", "")) };
    } else if (trimmed.startsWith("id:") && !current) {
      current = { id: extractYAMLValue(trimmed.replace("id:", "")) };
    } else if (trimmed.startsWith("title:") && current) {
      current.title = extractYAMLValue(trimmed.replace("title:", ""));
    }
  }

  // Push last entry
  if (current) videos.push(current);

  return videos;
}

/**
 * Extract a YAML value, stripping quotes.
 */
function extractYAMLValue(val) {
  return val.trim().replace(/^["']|["']$/g, "");
}

/**
 * Render a single video card with YouTube embed.
 */
function renderVideoCard(video) {
  return `
    <div class="video-card">
      <iframe
        src="https://www.youtube.com/embed/${video.id}"
        title="${escapeHTML(video.title)}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        loading="lazy"
      ></iframe>
      <div class="video-card-title">${escapeHTML(video.title)}</div>
    </div>
  `;
}

/* ============================================================
   MOBILE MENU
   ============================================================ */

/**
 * Initialize mobile hamburger menu toggle.
 */
function initMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  if (!toggle || !navLinks) return;

  toggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
    });
  });
}

/* ============================================================
   UTILITY
   ============================================================ */

/**
 * Escape HTML special characters to prevent XSS.
 */
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
