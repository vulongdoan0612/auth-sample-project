import mongoose from "mongoose";
import bcrypt from "bcrypt";

const employerSchema = new mongoose.Schema({
  companyName: { type: String, unique: true, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  confirmationCode: {
    type: String, default: null
  }
});

employerSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const Employer = mongoose.model('Employer', employerSchema);

export default Employer;
