(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  let period = "week";
  const names = {day:"сегодня", week:"за 7 дней", month:"за 30 дней"};
  const money = (value) => `${Number(value || 0).toLocaleString("ru-RU")} сум`;
  const escape = (value) => String(value || "—").replace(/[&<>"']/g, (x) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[x]));
  async function api(path, options = {}) { const res = await fetch(path, {headers:{"Content-Type":"application/json"}, ...options}); const data = res.status === 204 ? {} : await res.json(); if (!res.ok) throw new Error(data.error || "Ошибка"); return data; }
  function dateLabel(iso) { return new Date(iso).toLocaleString("ru-RU", {day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}); }
  function statusLabel(value) { return ({PENDING:"Ожидает",CONFIRMED:"Подтверждена",CANCELLED:"Отменена"}[value] || value); }
  async function render() {
    const data = await api(`/api/admin/dashboard?period=${period}`);
    $("#dashDate").textContent = `Данные обновлены: ${new Date().toLocaleString("ru-RU")}`;
    $("#dashPeriodName").textContent = names[period];
    $("#bookingCount").textContent = `${data.bookings.length} записей`;
    $("#dashMetrics").innerHTML = [[data.summary.count,"Записей"],[money(data.summary.expected),"Ожидаемая выручка"],[money(data.summary.paid),"Оплачено"],[money(data.summary.expected-data.summary.paid),"К оплате"]].map(([v,l])=>`<article class="metric"><b>${v}</b><span>${l} · ${names[period]}</span></article>`).join("");
    $("#serviceTrends").innerHTML = data.services.length ? data.services.map((s)=>`<div class="trend-row"><span>${escape(s.name)}</span><small><b>${s.count}</b> запис. · ${money(s.amount)}</small></div>`).join("") : "<p class=\"dash-muted\">За этот период записей пока нет.</p>";
    $("#upcomingList").innerHTML = data.upcoming.length ? data.upcoming.map((b)=>`<div class="upcoming-row"><div><b>${dateLabel(b.starts_at)}</b><small>${escape(b.customer_name)} · ${escape(b.service_name)}</small></div><strong>${money(b.price_uzs)}</strong></div>`).join("") : "<p class=\"dash-muted\">Ближайших записей нет.</p>";
    $("#bookingsTable").innerHTML = data.bookings.length ? data.bookings.map((b)=>`<tr><td>${dateLabel(b.starts_at)}</td><td>${escape(b.customer_name)}</td><td>${escape(b.contact || b.customer_email)}</td><td>${escape(b.service_name)}</td><td>${money(b.price_uzs)}</td><td><span class="status">${statusLabel(b.status)}</span></td><td><span class="status ${b.payment_status === "PAID" ? "paid" : ""}">${b.payment_status === "PAID" ? "Оплачено" : "Не оплачено"}</span></td></tr>`).join("") : "<tr><td colspan=\"7\" class=\"dash-muted\">Записей за выбранный период нет.</td></tr>";
  }
  async function start() {
    try { const {user} = await api("/api/auth/me"); if (!user || user.role !== "ADMIN") return; $("#ownerLogin").hidden=true; $("#ownerDashboard").hidden=false; await render(); setInterval(render,60000); }
    catch (_) {}
  }
  $("#ownerLoginForm").addEventListener("submit", async (e)=>{ e.preventDefault(); $("#ownerLoginError").textContent=""; try { const data=await api("/api/auth/login",{method:"POST",body:JSON.stringify({email:$("#ownerEmail").value,password:$("#ownerPassword").value})}); if(data.user.role!=="ADMIN") throw new Error("Этот аккаунт не является аккаунтом владельца"); $("#ownerLogin").hidden=true; $("#ownerDashboard").hidden=false; await render(); } catch(err) { $("#ownerLoginError").textContent=err.message; } });
  $(".period-tabs").addEventListener("click", (e)=>{ const b=e.target.closest("[data-period]"); if(!b)return; period=b.dataset.period; document.querySelectorAll("[data-period]").forEach(x=>x.classList.toggle("active",x===b)); render().catch(console.error); });
  $("#ownerLogout").addEventListener("click", async()=>{ await api("/api/auth/logout",{method:"POST"}); location.href="index.html"; });
  start();
})();
