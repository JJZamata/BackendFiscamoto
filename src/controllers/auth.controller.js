import db from "../models/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import authConfig from "../config/auth.config.js";

const { user: User, role: Role } = db;

export const signup = async (req, res) => {
  try {
    const { username, email, password, roles } = req.body;

    const hashedPassword = await bcrypt.hash(password, 8);

    const userRole = await Role.findOne({ where: { name: "user" } });

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    await user.setRoles([userRole]);

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const signin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      where: { username },
      include: { model: Role, as: "roles" },
    });

    if (!user) {
      return res.status(404).json({ message: "User Not found." });
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).json({
        accessToken: null,
        message: "Invalid Password!",
      });
    }

    const token = jwt.sign({ id: user.id }, authConfig.secret, {
      expiresIn: 86400, // 24 horas
    });

    const authorities = user.roles.map((role) => `ROLE_${role.name.toUpperCase()}`);

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities,
      accessToken: token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
