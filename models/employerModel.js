import mongoose from "mongoose";
import bcrypt from "bcrypt";

const employerSchema = new mongoose.Schema({
  companyName: { type: String, unique: true, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  avatar: { type: String, default: null },
  confirmationCode: { type: String, default: null },
  role: { type: String, default: 'employer' },
  anotherInformation: { type: Object },//M_Service (MoMo)
  employerInfo: { type: Object }
});

employerSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const Employer = mongoose.model('Employer', employerSchema);

export default Employer;
