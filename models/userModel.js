import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  confirmationCode: {
    type: String, default: null
  },
  avatar: { type: String, default: null },
  cvName: { type: String, default: null },
  cv: { type: String, default: null },
  userInfo: { type: Object },
  role: { type: String, default: 'user' }

});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
