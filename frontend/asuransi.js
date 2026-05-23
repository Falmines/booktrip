const API_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://booktrip-flame.vercel.app/api";

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const navbar = document.getElementById("navbar");
  const insuranceForm = document.getElementById("insuranceForm");
  const insuranceResults = document.getElementById("insuranceResults");
  const sortInsurance = document.getElementById("sortInsurance");
  const filterBtns = document.querySelectorAll(".filter-btn");

  const loginBtn = document.getElementById("loginBtn");
  const loginModal = document.getElementById("loginModal");
  const closeLogin = document.getElementById("closeLogin");
  const submitLogin = document.getElementById("submitLogin");
  const registerBtn = document.getElementById("registerBtn");
  const userInfo = document.getElementById("userInfo");

  let currentInsurance = [];

  const user = JSON.parse(localStorage.getItem("user"));

  if (user) {
    userInfo.textContent = user.name;
    loginBtn.textContent = "Akun Saya";
  }

  menuBtn.addEventListener("click", () => {
    navbar.classList.toggle("show");
  });

  loginBtn.addEventListener("click", () => {
    loginModal.classList.add("active");
  });

  closeLogin.addEventListener("click", () => {
    loginModal.classList.remove("active");
  });

  submitLogin.addEventListener("click", async () => {
    const email = document.getElementById("emailLogin").value.trim();
    const password = document.getElementById("passwordLogin").value.trim();

    if (!email || !password) {
      alert("Email dan password wajib diisi");
      return;
    }

    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Login gagal");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    alert("Login berhasil");
    location.reload();
  });

  registerBtn.addEventListener("click", async () => {
    const name = prompt("Masukkan nama:");
    const email = prompt("Masukkan email:");
    const password = prompt("Masukkan password:");

    if (!name || !email || !password) {
      alert("Semua data wajib diisi");
      return;
    }

    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Register gagal");
      return;
    }

    alert("Register berhasil, silakan login.");
  });

  function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(number);
  }

  function renderInsurance(data) {
    insuranceResults.innerHTML = "";

    if (!data || data.length === 0) {
      insuranceResults.innerHTML = `<p class="empty">Paket asuransi tidak ditemukan.</p>`;
      return;
    }

    data.forEach((item) => {
      const benefits = item.benefits
        ? item.benefits.split(",").map(benefit => `<span>✅ ${benefit.trim()}</span>`).join("")
        : "";

      insuranceResults.innerHTML += `
        <div class="insurance-card">
          <div class="package-icon">🛡</div>

          <span class="package-type">${item.type}</span>

          <h3>${item.name}</h3>

          <p class="insurance-desc">${item.description}</p>

          <div class="benefits">
            ${benefits}
          </div>

          <div class="coverage">
            Coverage hingga ${formatRupiah(item.coverage)}
          </div>

          <div class="insurance-bottom">
            <div class="price">
              <small>Mulai dari</small>
              <b>${formatRupiah(item.price)}</b>
            </div>

            <button class="buy-btn" onclick="goCheckout(${item.id})">
              Pilih
            </button>
          </div>
        </div>
      `;
    });
  }

  async function loadInsurances() {
    try {
      insuranceResults.innerHTML = "<p>Memuat paket asuransi dari database...</p>";

      const res = await fetch(`${API_URL}/insurances`);
      const data = await res.json();

      currentInsurance = data;
      renderInsurance(currentInsurance);
    } catch (error) {
      console.error(error);
      insuranceResults.innerHTML = "<p>Gagal mengambil data asuransi dari database.</p>";
    }
  }

  insuranceForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const destination = document.getElementById("destination").value.trim();
    const start_date = document.getElementById("startDate").value;
    const end_date = document.getElementById("endDate").value;

    if (!start_date || !end_date) {
      alert("Tanggal berangkat dan pulang wajib diisi!");
      return;
    }

    if (end_date < start_date) {
      alert("Tanggal pulang tidak boleh sebelum tanggal berangkat!");
      return;
    }

    try {
      insuranceResults.innerHTML = "<p>Mencari paket asuransi...</p>";

      const res = await fetch(`${API_URL}/insurances/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          destination,
          start_date,
          end_date
        })
      });

      const data = await res.json();

      currentInsurance = data;
      renderInsurance(currentInsurance);
    } catch (error) {
      console.error(error);
      alert("Backend belum jalan atau API error.");
    }
  });

  sortInsurance.addEventListener("change", () => {
    let sorted = [...currentInsurance];

    if (sortInsurance.value === "cheap") {
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sortInsurance.value === "expensive") {
      sorted.sort((a, b) => Number(b.price) - Number(a.price));
    }

    if (sortInsurance.value === "coverage") {
      sorted.sort((a, b) => Number(b.coverage) - Number(a.coverage));
    }

    renderInsurance(sorted);
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(item => item.classList.remove("active"));
      btn.classList.add("active");

      const selectedType = btn.dataset.type;

      if (selectedType === "all") {
        renderInsurance(currentInsurance);
        return;
      }

      const filtered = currentInsurance.filter(item => item.type === selectedType);
      renderInsurance(filtered);
    });
  });

  const today = new Date();
  const tomorrow = new Date();

  tomorrow.setDate(today.getDate() + 1);

  document.getElementById("startDate").value = today.toISOString().split("T")[0];
  document.getElementById("endDate").value = tomorrow.toISOString().split("T")[0];

  loadInsurances();
});

function goCheckout(id) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Silakan login terlebih dahulu sebelum checkout.");
    return;
  }

  window.location.href = `checkout.html?type=insurances&id=${id}`;
}