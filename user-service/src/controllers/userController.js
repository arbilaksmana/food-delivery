const User = require("../models/User.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Fungsi untuk Registrasi Pengguna Baru
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    // Cek apakah email sudah terdaftar (dengan index, query lebih cepat)
    const userExists = await User.findOne({ email }).lean();
    if (userExists) {
      return res
        .status(400)
        .json({ status: "error", message: "Email already exists" });
    }

    // Buat pengguna baru
    const user = await User.create({
      name,
      email,
      password,
      address,
      role: role && ["user","admin"].includes(role) ? role : undefined,
    });

    if (user) {
      res.status(201).json({
        status: "success",
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          address: user.address,
        },
      });
    } else {
      res.status(400).json({ status: "error", message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Fungsi untuk Login Pengguna
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cari pengguna berdasarkan email (dengan index, query lebih cepat)
    const user = await User.findOne({ email }).lean();

    // Cek pengguna dan bandingkan password
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { id: user._id.toString(), role: user.role || "user" },
        process.env.JWT_SECRET || "supersecret_shared_key",
        {
          expiresIn: "1d", // Durasi token
        }
      );

      res.status(200).json({
        status: "success",
        data: {
          token,
        },
      });
    } else {
      res
        .status(401)
        .json({ status: "error", message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (user) {
      res.status(200).json({
        status: "success",
        data: {
          user,
        },
      });
    } else {
      res.status(404).json({ status: "error", message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// Fungsi untuk Logout Pengguna
exports.logoutUser = async (req, res) => {
  try {
    // Untuk JWT stateless, logout dilakukan di client side dengan menghapus token
    // Endpoint ini untuk konsistensi API dan logging purposes
    // Di production, bisa ditambahkan token blacklist mechanism
    
    res.status(200).json({
      status: "success",
      message: "Logout successful. Please remove token from client storage.",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
