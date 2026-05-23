/* ===============================
   BOOKTRIP INDEX SCRIPT - FIXED
================================ */

const API_URL = "http://localhost:5000/api";

window.currentService = "flights";

window.changeTab = function (service, element) {
  window.currentService = service;

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.remove("active");
  });

  element.classList.add("active");
};

/* ===============================
   DOM READY
================================ */

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const loginModal = document.getElementById("loginModal");
  const closeLogin = document.getElementById("closeLogin");
  const submitLogin = document.getElementById("submitLogin");
  const registerBtn = document.getElementById("registerBtn");

  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navbar = document.getElementById("navbar");

  const searchBtn = document.getElementById("searchBtn");
  const swapBtn = document.getElementById("swapBtn");

  const originInput = document.getElementById("origin");
  const destinationInput = document.getElementById("destination");
  const departureDateInput = document.getElementById("departureDate");
  const returnDateInput = document.getElementById("returnDate");
  const passengerInput = document.getElementById("passenger");

  const destinationGrid = document.getElementById("destinationGrid");

  /* ===============================
     MOBILE NAVBAR
  ================================ */

  if (hamburgerBtn && navbar) {
    hamburgerBtn.addEventListener("click", () => {
      navbar.classList.toggle("show");
    });
  }

  /* ===============================
     LOGIN MODAL
  ================================ */

  if (loginBtn && loginModal) {
    loginBtn.addEventListener("click", () => {
      loginModal.classList.add("active");
    });
  }

  if (closeLogin && loginModal) {
    closeLogin.addEventListener("click", () => {
      loginModal.classList.remove("active");
    });
  }

  if (loginModal) {
    loginModal.addEventListener("click", (e) => {
      if (e.target === loginModal) {
        loginModal.classList.remove("active");
      }
    });
  }

  const savedUser = localStorage.getItem("user");

  if (savedUser && loginBtn) {
    try {
      const user = JSON.parse(savedUser);
      loginBtn.textContent = user.name || "Akun Saya";
    } catch {
      loginBtn.textContent = "Akun Saya";
    }
  }

  /* ===============================
     LOGIN API
  ================================ */

  if (submitLogin) {
    submitLogin.addEventListener("click", async () => {
      const emailInput = document.getElementById("emailLogin");
      const passwordInput = document.getElementById("passwordLogin");

      const email = emailInput ? emailInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value.trim() : "";

      if (!email || !password) {
        alert("Email dan password wajib diisi");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Login gagal");
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Login berhasil");

        if (loginModal) {
          loginModal.classList.remove("active");
        }

        if (loginBtn) {
          loginBtn.textContent = data.user.name || "Akun Saya";
        }
      } catch (error) {
        console.error(error);
        alert("Backend belum jalan atau API login error");
      }
    });
  }

  /* ===============================
     REGISTER API
  ================================ */

  if (registerBtn) {
    registerBtn.addEventListener("click", async () => {
      const name = prompt("Masukkan nama:");
      const email = prompt("Masukkan email:");
      const password = prompt("Masukkan password:");

      if (!name || !email || !password) {
        alert("Semua data wajib diisi");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            email,
            password
          })
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Register gagal");
          return;
        }

        alert("Register berhasil, silakan login");
      } catch (error) {
        console.error(error);
        alert("Backend belum jalan atau API register error");
      }
    });
  }

  /* ===============================
     SWAP INPUT
  ================================ */

  if (swapBtn && originInput && destinationInput) {
    swapBtn.addEventListener("click", () => {
      const temp = originInput.value;
      originInput.value = destinationInput.value;
      destinationInput.value = temp;
    });
  }

  /* ===============================
     SEARCH BUTTON
  ================================ */

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const origin = originInput ? originInput.value.trim() : "";
      const destination = destinationInput ? destinationInput.value.trim() : "";
      const departureDate = departureDateInput ? departureDateInput.value : "";
      const returnDate = returnDateInput ? returnDateInput.value : "";
      const passenger = passengerInput ? passengerInput.value : "1";

      if (!destination) {
        alert("Tujuan wajib diisi");
        return;
      }

      const query = new URLSearchParams({
        origin,
        destination,
        departure: departureDate,
        return: returnDate,
        passenger
      }).toString();

      if (window.currentService === "flights") {
        window.location.href = `tiket-pesawat.html?${query}`;
      }

      if (window.currentService === "hotels") {
        window.location.href = `hotel.html?city=${encodeURIComponent(destination)}&checkin=${departureDate}&checkout=${returnDate}&guest=${passenger}`;
      }

      if (window.currentService === "trains") {
        window.location.href = `kereta-api.html?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&date=${departureDate}`;
      }

      if (window.currentService === "buses") {
        window.location.href = `bus-travel.html?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&date=${departureDate}`;
      }

      if (window.currentService === "cars") {
        window.location.href = `sewa-mobil.html?city=${encodeURIComponent(destination)}&pickup=${departureDate}&return=${returnDate}`;
      }
    });
  }

  /* ===============================
     LOAD DESTINATIONS FROM DB
  ================================ */

  loadDestinations();

  async function loadDestinations() {
    if (!destinationGrid) return;

    try {
      const res = await fetch(`${API_URL}/destinations`);

      if (!res.ok) {
        destinationGrid.innerHTML = `
          <p style="color:#64748b;">
            Endpoint /api/destinations belum tersedia di backend.
          </p>
        `;
        return;
      }

      const contentType = res.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        destinationGrid.innerHTML = `
          <p style="color:#64748b;">
            API destinations mengembalikan HTML, bukan JSON.
          </p>
        `;
        return;
      }

      const destinations = await res.json();

      destinationGrid.innerHTML = "";

      if (!destinations || destinations.length === 0) {
        destinationGrid.innerHTML = `
          <p style="color:#64748b;">
            Data destinasi masih kosong.
          </p>
        `;
        return;
      }

      destinations.forEach((item) => {
        destinationGrid.innerHTML += `
          <div class="destination-card" style="background-image:url('${item.image}')">
            <div class="destination-info">
              <b>${item.name}</b>
              <span>${item.category || "Destinasi"}</span>
              <b>Rp ${Number(item.price || 0).toLocaleString("id-ID")}</b>
            </div>
            <div class="plane-icon">✈</div>
          </div>
        `;
      });
    } catch (error) {
      console.error(error);

      destinationGrid.innerHTML = `
        <p style="color:#64748b;">
          Gagal mengambil data destinasi dari database.
        </p>
      `;
    }
  }
});
const submitLogin = document.getElementById("submitLogin");
const registerBtn = document.getElementById("registerBtn");


const loginBtn = document.getElementById("loginBtn");


submitLogin.addEventListener("click", async () => {
  const email = document.getElementById("emailLogin").value.trim();
  const password = document.getElementById("passwordLogin").value.trim();

  if (!email || !password) {
    alert("Email dan password wajib diisi");
    return;
  }

  try {
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

    loginModal.classList.remove("active");
    loginBtn.textContent = data.user.name || "Akun Saya";

  } catch (error) {
    console.error(error);
    alert("Backend belum jalan atau API login error");
  }
});

registerBtn.addEventListener("click", async () => {
  const name = prompt("Masukkan nama:");
  const email = prompt("Masukkan email:");
  const password = prompt("Masukkan password:");

  if (!name || !email || !password) {
    alert("Semua data wajib diisi");
    return;
  }

  try {
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

    alert("Register berhasil, silakan login");

  } catch (error) {
    console.error(error);
    alert("Backend belum jalan atau API register error");
  }
});