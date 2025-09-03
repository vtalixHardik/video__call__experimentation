const mongoose = require("mongoose");
require("dotenv").config();

const Connection = async () => {
    const Mongo_Username = process.env.MONGO_USERNAME;
    const Mongo_Password = process.env.MONGO_PASSWORD;
    const URL = `mongodb+srv://${Mongo_Username}:${Mongo_Password}@cluster0.wr1yglo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/webrtc--call`;

    try {
    await mongoose.connect(URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log("Database connected");
  } catch (error) {
    console.error("error connecting to database", error.message);
    console.table(error);
  }
}

module.exports = { Connection };