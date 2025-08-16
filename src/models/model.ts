import mongoose, { Schema, model } from "mongoose";

mongoose.set("strictQuery", false);

export interface User {
  name: string;
  email: string;
  password: string;
}

export const UserSchema = new Schema<User>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true, trim: true },
});

export const UserModel = model<User>("User", UserSchema);

export interface Todo {
  title: string;
  desc?: string;
  user: mongoose.Types.ObjectId;
}

export const TodoSchema = new Schema<Todo>({
  title: { type: String, required: true, trim: true },
  desc: { type: String, trim: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export const TodoModel = model<Todo>("Todo", TodoSchema);
