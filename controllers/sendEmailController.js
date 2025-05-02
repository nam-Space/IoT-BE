const nodemailer = require("nodemailer");
const User = require("../models/userModel");
const hbs = require("nodemailer-handlebars");
const path = require("path");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "namhello2003@gmail.com", // 💌 Thay bằng email của cậu
    pass: "jgspgmkezftvvylg", // 🔑 Là app password chứ không phải password thường nha
  },
});

transporter.use(
  "compile",
  hbs({
    viewEngine: {
      extname: ".hbs",
      partialsDir: path.resolve("./views/"),
      layoutsDir: path.resolve("./views/"),
      defaultLayout: false,
    },
    viewPath: path.resolve("./views/"),
    extName: ".hbs",
  })
);

const sendEmail = async (req, res) => {
  try {
    const { IsCO2Exceed, CO2 } = req.body;
    const users = await User.find({});

    const emailPromises = users.map((user) => {
      const mailOptions = {
        from: "admin@gmail.com",
        to: user.username,
        subject: IsCO2Exceed
          ? "⚠️ Cảnh báo: Nồng độ CO₂ vượt ngưỡng!"
          : "🌿 Thông báo: Nồng độ CO₂ an toàn",
        template: "alerts", // 🧵 Tên template (alert.hbs)
        context: {
          fullName: user.fullName || user.username,
          IsCO2Exceed,
          CO2,
        },
      };

      return transporter
        .sendMail(mailOptions)
        .then((info) => {
          console.log(`✅ Đã gửi đến ${user.username}:`, info.response);
          return { email: user.username, status: "sent" };
        })
        .catch((error) => {
          console.log(`💥 Gửi thất bại đến ${user.username}:`, error);
          return {
            email: user.username,
            status: "failed",
            error: error.message,
          };
        });
    });

    const results = await Promise.all(emailPromises);

    res.status(200).json({
      message: "🎯 Đã gửi xong tất cả email!",
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error("💔 Lỗi khi gửi email:", error.message);
  }
};

module.exports = {
  sendEmail,
};
