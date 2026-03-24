import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'teacher', 'student', 'parent', 'accountant'], 
    required: true 
  },
  avatar: { 
    type: String 
  },
  phone: { 
    type: String 
  },
  address: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: { 
    type: Date 
  },
  resetPasswordToken: { 
    type: String 
  },
  resetPasswordExpires: { 
    type: Date 
  },
  assignedClass: { 
    type: String 
  },
  division: { 
    type: String 
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);