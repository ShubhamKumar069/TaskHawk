const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true, trim: true },
});

const UserModel = mongoose.model("User", UserSchema);

// Todo Schema
const TodoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  desc: { type: String, trim: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const TodoModel = mongoose.model("Todo", TodoSchema);

module.exports = {
  UserModel,
  TodoModel,
};
