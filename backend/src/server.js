const dotenv = require("dotenv");
const app = require("./app");
const connectDB = require("./config/db");
const User = require('./models/User');
const Patient = require('./models/Patient');

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  try {
    await User.init();
    await Patient.init();
  } catch (e) {
    console.error('Index initialization failed:', e?.message || e);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

