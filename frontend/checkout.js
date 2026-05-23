const API_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://booktrip-flame.vercel.app/api";

const token = localStorage.getItem("token");
const params = new URLSearchParams(window.location.search);

const type = params.get("type");
const id = params.get("id");

let selectedData = null;

if (!token) {
  alert("Silakan login dulu");
  window.location.href = "index.html";
}

if (!type || !id) {
  alert("Data checkout tidak valid");
  window.location.href = "index.html";
}

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(Number(number || 0));
}

function getPrice(data) {
  return (
    data.price ||
    data.price_per_night ||
    data.price_per_day ||
    0
  );
}

function getTitle(data) {
  return (
    data.airline ||
    data.name ||
    data.train_name ||
    data.bus_name ||
    data.car_name ||
    data.title ||
    "Layanan BookTrip"
  );
}

function getDetail(data) {
  if (type === "flights") {
    return `${data.origin} → ${data.destination}`;
  }

  if (type === "hotels") {
    return `${data.city} - ${data.address || ""}`;
  }

  if (type === "trains") {
    return `${data.origin_station} → ${data.destination_station}`;
  }

  if (type === "buses") {
    return `${data.origin_city} → ${data.destination_city}`;
  }

  if (type === "cars") {
    return `${data.city} - ${data.transmission}`;
  }

  if (type === "xperiences") {
    return `${data.location} - ${data.category}`;
  }

  if (type === "insurances") {
    return `${data.type} - Coverage ${formatRupiah(data.coverage)}`;
  }

  return "-";
}

async function loadDetail() {
  try {
    const res = await fetch(`${API_URL}/detail/${type}/${id}`);

    const contentType = res.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("API mengembalikan HTML, bukan JSON");
    }

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Data tidak ditemukan");
      window.location.href = "index.html";
      return;
    }

    selectedData = data;

    document.getElementById("serviceName").textContent = getTitle(data);
    document.getElementById("serviceDetail").textContent = getDetail(data);
    document.getElementById("totalPrice").textContent = formatRupiah(getPrice(data));

  } catch (error) {
    console.error(error);
    alert("Gagal mengambil detail checkout");
  }
}

document.getElementById("checkoutBtn").addEventListener("click", async () => {
  const passengerName = document.getElementById("passengerName").value.trim();
  const passengerPhone = document.getElementById("passengerPhone").value.trim();
  const passengerEmail = document.getElementById("passengerEmail").value.trim();

  if (!passengerName || !passengerPhone || !passengerEmail) {
    alert("Data pemesan wajib diisi");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        service_type: type,
        service_id: id,
        total_price: getPrice(selectedData)
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Checkout gagal");
      return;
    }

    window.location.href = `payment.html?booking_id=${data.booking.id}`;
  } catch (error) {
    console.error(error);
    alert("Gagal checkout");
  }
});

loadDetail();