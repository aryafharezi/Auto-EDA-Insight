/**
 * Auto EDA Insight — script.js
 * SD-1306 Data Science Programming
 * Institut Teknologi Sains Bandung
 * Lecturer: Bakti Siregar, M.Sc.
 */

"use strict";

/* ── Utility ──────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function showLoading(msg = "Memproses...") {
  let overlay = document.getElementById("eda-loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "eda-loading-overlay";
    overlay.className = "loading-overlay";
    overlay.innerHTML = `<div class="spinner"></div><span id="eda-loading-msg">${msg}</span>`;
    document.body.appendChild(overlay);
  } else {
    document.getElementById("eda-loading-msg").textContent = msg;
    overlay.style.display = "flex";
  }
}

function hideLoading() {
  const overlay = document.getElementById("eda-loading-overlay");
  if (overlay) overlay.style.display = "none";
}

function showToast(msg, type = "info", duration = 3500) {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:99999;
    padding:12px 20px; border-radius:8px; font-size:.9rem;
    font-family:'Space Grotesk',sans-serif; font-weight:500;
    background:${type==="success"?"#1a5c30":type==="danger"?"#5c1a1a":"#0d3351"};
    border:1px solid ${type==="success"?"#27ae60":type==="danger"?"#e74c3c":"#25C5E9"};
    color:#F2FFF6; box-shadow:0 4px 20px rgba(0,0,0,.4);
    animation: fadeIn .3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity="0"; toast.style.transition="opacity .4s"; }, duration - 400);
  setTimeout(() => toast.remove(), duration);
}

/* ── File Upload ──────────────────────────────────────────────── */
class FileUploader {
  constructor({ dropZoneId, inputId, infoId, btnId, onSuccess }) {
    this.dropZone = document.getElementById(dropZoneId);
    this.input    = document.getElementById(inputId);
    this.info     = document.getElementById(infoId);
    this.btn      = document.getElementById(btnId);
    this.onSuccess = onSuccess;
    this.file = null;

    if (this.dropZone) {
      this.dropZone.addEventListener("dragover",  e => { e.preventDefault(); this.dropZone.classList.add("drag-over"); });
      this.dropZone.addEventListener("dragleave", () => this.dropZone.classList.remove("drag-over"));
      this.dropZone.addEventListener("drop",      e => { e.preventDefault(); this.dropZone.classList.remove("drag-over"); this._setFile(e.dataTransfer.files[0]); });
      this.dropZone.addEventListener("click",     () => this.input?.click());
    }
    if (this.input) this.input.addEventListener("change", () => this._setFile(this.input.files[0]));
    if (this.btn)   this.btn.addEventListener("click",    () => this.upload());
  }

  _setFile(file) {
    if (!file) return;
    const allowed = [".xlsx", ".xls", ".csv", ".txt"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) { showToast("❌ Format tidak didukung. Gunakan .xlsx, .csv, atau .txt", "danger"); return; }
    this.file = file;
    const kb = (file.size / 1024).toFixed(1);
    if (this.info) { this.info.innerHTML = `✅ <b>${file.name}</b> — ${kb} KB`; this.info.style.color = "#CAFFDE"; }
    if (this.btn)  this.btn.style.display = "inline-flex";
  }

  async upload() {
    if (!this.file) return;
    showLoading("Mengupload & memproses data...");
    const fd = new FormData();
    fd.append("file", this.file);
    try {
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      hideLoading();
      if (data.success) {
        showToast("✅ Data berhasil diupload!", "success");
        if (this.onSuccess) this.onSuccess(data);
        else window.location.href = "/dashboard";
      } else {
        showToast("❌ " + data.error, "danger", 5000);
        if (this.info) { this.info.textContent = "❌ " + data.error; this.info.style.color = "#ff6b6b"; }
      }
    } catch(err) {
      hideLoading();
      showToast("❌ Koneksi gagal: " + err.message, "danger", 5000);
    }
  }
}

/* ── API Helpers ──────────────────────────────────────────────── */
async function apiGet(endpoint) {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* ── Data Preview Table ───────────────────────────────────────── */
function renderPreviewTable(container, data) {
  if (!container || !data.columns) return;
  const { columns, rows } = data;
  let html = `<table><thead><tr>${columns.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>`;
  rows.forEach(row => {
    html += "<tr>" + row.map(v => `<td>${v ?? ""}</td>`).join("") + "</tr>";
  });
  html += "</tbody></table>";
  container.innerHTML = html;
}

/* ── Stat Cards ───────────────────────────────────────────────── */
function renderStatCards(container, items) {
  if (!container) return;
  container.innerHTML = items.map(item => `
    <div class="card" style="text-align:center">
      <div style="font-size:1.6rem;font-weight:700;color:var(--sky)">${item.value}</div>
      <div style="font-size:.78rem;color:var(--tea);margin-top:4px">${item.label}</div>
    </div>`).join("");
}

/* ── Plotly Chart Renderer ────────────────────────────────────── */
function renderPlotlyChart(divId, chartData) {
  if (!window.Plotly || !chartData) return;
  try {
    const { data, layout } = typeof chartData === "string" ? JSON.parse(chartData) : chartData;
    Plotly.react(divId, data, layout, { responsive: true, displayModeBar: false });
  } catch(e) {
    console.warn("Chart render error:", e);
  }
}

/* ── Insight Renderer ─────────────────────────────────────────── */
function renderInsights(container, insights) {
  if (!container || !insights) return;
  const colorMap = { info: "#25C5E9", success: "#27ae60", warning: "#f39c12", danger: "#e74c3c" };
  container.innerHTML = insights.map(i => {
    const color = colorMap[i.type] || colorMap.info;
    return `
    <div style="padding:14px 18px;background:rgba(37,197,233,0.06);border-left:3px solid ${color};border-radius:8px;margin-bottom:10px">
      <div style="font-weight:600;margin-bottom:4px">${i.icon || "💡"} ${i.title || ""}</div>
      <div style="font-size:.88rem;color:var(--tea)">${i.text || i}</div>
    </div>`;
  }).join("");
}

/* ── Pagination Helper ────────────────────────────────────────── */
function renderPagination(container, currentPage, totalPages, onPageChange) {
  if (!container) return;
  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    const active = i === currentPage ? "background:var(--sky);color:var(--ink);" : "";
    html += `<button onclick="(${onPageChange})(${i})" style="padding:4px 10px;border:1px solid var(--sky-border);border-radius:4px;background:transparent;color:var(--mint);cursor:pointer;margin:2px;${active}">${i}</button>`;
  }
  container.innerHTML = html;
}

/* ── Export Buttons ───────────────────────────────────────────── */
function initExportButtons() {
  $$("[data-export]").forEach(btn => {
    btn.addEventListener("click", () => {
      const fmt = btn.dataset.export;
      window.open(`/api/export/${fmt}`, "_blank");
    });
  });
}

/* ── Init ─────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initExportButtons();
});
