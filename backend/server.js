const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "booktrip_secret";

app.use(cors());
app.use(express.json());

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token tidak ada" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ message: "Token tidak valid" });
  }
}

/* AUTH */
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Semua data wajib diisi" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, "user"]
    );

    res.json({
      message: "Register berhasil",
      user: result.rows[0]
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Email sudah digunakan / register gagal" });
  }
});

app.post("/api/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    const result = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Email tidak ditemukan"
      });
    }

    const user = result.rows[0];

    let validPassword = false;

    /* =========================
       CEK BCRYPT
    ========================= */

    if (
      user.password.startsWith("$2a$") ||
      user.password.startsWith("$2b$")
    ) {

      validPassword = await bcrypt.compare(
        password,
        user.password
      );

    }

    /* =========================
       CEK PLAIN TEXT
    ========================= */

    else {

      validPassword = password === user.password;

      /* AUTO CONVERT KE BCRYPT */
      if (validPassword) {

        const hashedPassword = await bcrypt.hash(
          password,
          10
        );

        await db.query(
          `
          UPDATE users
          SET password = $1
          WHERE id = $2
          `,
          [
            hashedPassword,
            user.id
          ]
        );

      }

    }

    if (!validPassword) {
      return res.status(401).json({
        message: "Password salah"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server error"
    });

  }
});

/* HOME */
app.get("/api/home", async (req, res) => {
  const destinations = await db.query("SELECT * FROM destinations ORDER BY id DESC");
  const promos = await db.query("SELECT * FROM promos ORDER BY id DESC LIMIT 3");

  res.json({
    destinations: destinations.rows,
    promos: promos.rows
  });
});

/* DESTINATIONS */
app.get("/api/destinations", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM destinations ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Gagal mengambil data destinations" });
  }
});

/* FLIGHTS */
app.get("/api/flights", async (req, res) => {
  const result = await db.query("SELECT * FROM flights ORDER BY id DESC");
  res.json(result.rows);
});

app.get("/api/flights/:id", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM flights WHERE id = $1",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Flight tidak ditemukan" });
  }

  res.json(result.rows[0]);
});

app.post("/api/flights/search", async (req, res) => {
  const { origin, destination, departure_date } = req.body;

  const result = await db.query(
    `SELECT * FROM flights
     WHERE origin ILIKE $1
     AND destination ILIKE $2
     AND departure_date = $3
     ORDER BY price ASC`,
    [`%${origin}%`, `%${destination}%`, departure_date]
  );

  res.json(result.rows);
});

app.post("/api/flights", async (req, res) => {
  const {
    airline,
    origin,
    destination,
    departure_date,
    return_date,
    departure_time,
    arrival_time,
    passenger,
    class_type,
    price,
    image,
    duration
  } = req.body;

  const result = await db.query(
    `INSERT INTO flights
    (airline, origin, destination, departure_date, return_date, departure_time, arrival_time, passenger, class_type, price, image, duration)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,
    [airline, origin, destination, departure_date, return_date, departure_time, arrival_time, passenger, class_type, price, image, duration]
  );

  res.json({ message: "Tiket pesawat berhasil ditambah", data: result.rows[0] });
});

/* HOTELS */
app.get("/api/hotels", async (req, res) => {
  const result = await db.query("SELECT * FROM hotels ORDER BY id DESC");
  res.json(result.rows);
});

app.get("/api/hotels/:id", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM hotels WHERE id = $1",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Hotel tidak ditemukan" });
  }

  res.json(result.rows[0]);
});

app.post("/api/hotels/search", async (req, res) => {
  const { city } = req.body;

  const result = await db.query(
    "SELECT * FROM hotels WHERE city ILIKE $1 ORDER BY price_per_night ASC",
    [`%${city}%`]
  );

  res.json(result.rows);
});

app.post("/api/hotels", async (req, res) => {
  const {
    name,
    city,
    address,
    rating,
    star,
    price_per_night,
    image,
    facilities
  } = req.body;

  const result = await db.query(
    `INSERT INTO hotels
    (name, city, address, rating, star, price_per_night, image, facilities)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`,
    [name, city, address, rating, star, price_per_night, image, facilities]
  );

  res.json({ message: "Hotel berhasil ditambah", data: result.rows[0] });
});

/* TRAINS */
app.get("/api/trains", async (req, res) => {
  const result = await db.query("SELECT * FROM trains ORDER BY id DESC");
  res.json(result.rows);
});

app.get("/api/trains/:id", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM trains WHERE id = $1",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Kereta tidak ditemukan" });
  }

  res.json(result.rows[0]);
});

app.post("/api/trains/search", async (req, res) => {
  const { origin_station, destination_station, departure_date } = req.body;

  const result = await db.query(
    `SELECT * FROM trains
     WHERE origin_station ILIKE $1
     AND destination_station ILIKE $2
     AND departure_date = $3
     ORDER BY price ASC`,
    [`%${origin_station}%`, `%${destination_station}%`, departure_date]
  );

  res.json(result.rows);
});

app.post("/api/trains", async (req, res) => {
  const {
    train_name,
    origin_station,
    destination_station,
    departure_date,
    departure_time,
    arrival_time,
    duration,
    class_type,
    price
  } = req.body;

  const result = await db.query(
    `INSERT INTO trains
    (train_name, origin_station, destination_station, departure_date, departure_time, arrival_time, duration, class_type, price)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [train_name, origin_station, destination_station, departure_date, departure_time, arrival_time, duration, class_type, price]
  );

  res.json({ message: "Kereta berhasil ditambah", data: result.rows[0] });
});

/* BUSES */
app.get("/api/buses", async (req, res) => {
  const result = await db.query("SELECT * FROM buses ORDER BY id DESC");
  res.json(result.rows);
});

app.get("/api/buses/:id", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM buses WHERE id = $1",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Bus tidak ditemukan" });
  }

  res.json(result.rows[0]);
});

app.post("/api/buses/search", async (req, res) => {
  const { origin_city, destination_city, departure_date } = req.body;

  const result = await db.query(
    `SELECT * FROM buses
     WHERE origin_city ILIKE $1
     AND destination_city ILIKE $2
     AND departure_date = $3
     ORDER BY price ASC`,
    [`%${origin_city}%`, `%${destination_city}%`, departure_date]
  );

  res.json(result.rows);
});

app.post("/api/buses", async (req, res) => {
  const {
    bus_name,
    origin_city,
    destination_city,
    departure_date,
    departure_time,
    arrival_time,
    duration,
    seat_type,
    price
  } = req.body;

  const result = await db.query(
    `INSERT INTO buses
    (bus_name, origin_city, destination_city, departure_date, departure_time, arrival_time, duration, seat_type, price)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [bus_name, origin_city, destination_city, departure_date, departure_time, arrival_time, duration, seat_type, price]
  );

  res.json({ message: "Bus berhasil ditambah", data: result.rows[0] });
});

/* CARS */
app.get("/api/cars", async (req, res) => {
  const result = await db.query("SELECT * FROM cars ORDER BY id DESC");
  res.json(result.rows);
});

app.get("/api/cars/:id", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM cars WHERE id = $1",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Mobil tidak ditemukan" });
  }

  res.json(result.rows[0]);
});

app.post("/api/cars/search", async (req, res) => {
  const { city } = req.body;

  const result = await db.query(
    "SELECT * FROM cars WHERE city ILIKE $1 AND status = 'available'",
    [`%${city}%`]
  );

  res.json(result.rows);
});

app.post("/api/cars", async (req, res) => {
  const {
    car_name,
    city,
    transmission,
    seat_count,
    price_per_day,
    image,
    status
  } = req.body;

  const result = await db.query(
    `INSERT INTO cars
    (car_name, city, transmission, seat_count, price_per_day, image, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *`,
    [car_name, city, transmission, seat_count, price_per_day, image, status || "available"]
  );

  res.json({ message: "Mobil berhasil ditambah", data: result.rows[0] });
});

/* PROMOS */
app.get("/api/promos", async (req, res) => {
  const result = await db.query("SELECT * FROM promos ORDER BY id DESC");
  res.json(result.rows);
});

app.get("/api/promos/:id", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM promos WHERE id = $1",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Promo tidak ditemukan" });
  }

  res.json(result.rows[0]);
});

app.post("/api/promos", async (req, res) => {
  const {
    title,
    category,
    discount_percent,
    code,
    description,
    start_date,
    end_date
  } = req.body;

  const result = await db.query(
    `INSERT INTO promos
    (title, category, discount_percent, code, description, start_date, end_date)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *`,
    [title, category, discount_percent, code, description, start_date, end_date]
  );

  res.json({ message: "Promo berhasil ditambah", data: result.rows[0] });
});

app.post("/api/promos/claim/:id", auth, async (req, res) => {
  try {
    const promo = await db.query(
      "SELECT * FROM promos WHERE id = $1",
      [req.params.id]
    );

    if (promo.rows.length === 0) {
      return res.status(404).json({ message: "Promo tidak ditemukan" });
    }

    await db.query(
      "INSERT INTO claimed_promos (user_id, promo_id) VALUES ($1, $2)",
      [req.user.id, req.params.id]
    );

    res.json({ message: "Promo berhasil diklaim" });
  } catch {
    res.status(400).json({ message: "Promo sudah pernah diklaim" });
  }
});

/* XPERIENCES */
app.get("/api/xperiences", async (req, res) => {
  const result = await db.query("SELECT * FROM xperiences ORDER BY id DESC");
  res.json(result.rows);
});

app.get("/api/xperiences/:id", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM xperiences WHERE id = $1",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Xperience tidak ditemukan" });
  }

  res.json(result.rows[0]);
});

app.post("/api/xperiences/search", async (req, res) => {
  const { keyword, category } = req.body;

  let query = "SELECT * FROM xperiences WHERE 1=1";
  const params = [];

  if (keyword) {
    params.push(`%${keyword}%`);
    query += ` AND (
      title ILIKE $${params.length}
      OR category ILIKE $${params.length}
      OR location ILIKE $${params.length}
      OR description ILIKE $${params.length}
    )`;
  }

  if (category && category !== "all") {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }

  query += " ORDER BY id DESC";

  const result = await db.query(query, params);
  res.json(result.rows);
});

app.post("/api/xperiences", async (req, res) => {
  const {
    title,
    category,
    location,
    rating,
    duration,
    price,
    description,
    image
  } = req.body;

  const result = await db.query(
    `INSERT INTO xperiences
    (title, category, location, rating, duration, price, description, image)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`,
    [title, category, location, rating, duration, price, description, image]
  );

  res.json({ message: "Xperience berhasil ditambah", data: result.rows[0] });
});

/* INSURANCES */
app.get("/api/insurances", async (req, res) => {
  const result = await db.query("SELECT * FROM insurances ORDER BY id DESC");
  res.json(result.rows);
});

app.get("/api/insurances/:id", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM insurances WHERE id = $1",
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Asuransi tidak ditemukan" });
  }

  res.json(result.rows[0]);
});

app.post("/api/insurances/search", async (req, res) => {
  const { destination } = req.body;

  const result = await db.query(
    `SELECT * FROM insurances
     WHERE destination ILIKE $1 OR destination = 'All'
     ORDER BY price ASC`,
    [`%${destination}%`]
  );

  res.json(result.rows);
});

app.post("/api/insurances", async (req, res) => {
  const {
    name,
    type,
    destination,
    price,
    coverage,
    description,
    benefits
  } = req.body;

  const result = await db.query(
    `INSERT INTO insurances
    (name, type, destination, price, coverage, description, benefits)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *`,
    [name, type, destination || "All", price, coverage, description, benefits]
  );

  res.json({ message: "Asuransi berhasil ditambah", data: result.rows[0] });
});

/* DETAIL UNIVERSAL */
app.get("/api/detail/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;

    const tables = {
      flights: "flights",
      hotels: "hotels",
      trains: "trains",
      buses: "buses",
      promos: "promos",
      xperiences: "xperiences",
      cars: "cars",
      insurances: "insurances"
    };

    if (!tables[type]) {
      return res.status(400).json({ message: "Tipe layanan tidak valid" });
    }

    const result = await db.query(
      `SELECT * FROM ${tables[type]} WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/* BOOKINGS */
app.post("/api/bookings", auth, async (req, res) => {
  const { service_type, service_id, total_price } = req.body;

  const result = await db.query(
    `INSERT INTO bookings
    (user_id, service_type, service_id, total_price)
    VALUES ($1,$2,$3,$4)
    RETURNING *`,
    [req.user.id, service_type, service_id, total_price]
  );

  res.json({
    message: "Booking berhasil dibuat",
    booking: result.rows[0]
  });
});

app.get("/api/bookings/:id", auth, async (req, res) => {
  const result = await db.query(
    "SELECT * FROM bookings WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Booking tidak ditemukan" });
  }

  res.json(result.rows[0]);
});

app.get("/api/my-bookings", auth, async (req, res) => {
  const result = await db.query(
    "SELECT * FROM bookings WHERE user_id = $1 ORDER BY id DESC",
    [req.user.id]
  );

  res.json(result.rows);
});

/* PAYMENTS */
app.post("/api/payments", auth, async (req, res) => {
  const { booking_id, payment_method, amount } = req.body;

  const payment = await db.query(
    `INSERT INTO payments
    (booking_id, payment_method, amount, status, paid_at)
    VALUES ($1,$2,$3,'paid',CURRENT_TIMESTAMP)
    RETURNING *`,
    [booking_id, payment_method, amount]
  );

  await db.query(
    `UPDATE bookings
     SET payment_status = 'paid',
         status = 'confirmed'
     WHERE id = $1`,
    [booking_id]
  );

  res.json({
    message: "Pembayaran berhasil",
    payment: payment.rows[0]
  });
});

/* TEST */
app.get("/", (req, res) => {
  res.send("BookTrip API berjalan...");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});