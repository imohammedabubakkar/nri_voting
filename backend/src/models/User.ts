import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  dob: string;
  age: number;
  aadhaar: string;
  voterId: string;
  passport?: string;
  country: string;
  currentPlace: string;
  currentAddress: string;
  currentPincode: string;
  indianAddress: string;
  indianState: string;
  indianDistrict: string;
  indianPlace: string;
  assemblyConstituency: string;
  parliamentConstituency: string;
  constituency: string;
  indianPincode: string;
  hasVotedAssembly: boolean;
  hasVotedParliament: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    dob: {
      type: String,
      required: [true, 'Date of birth is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [18, 'Voter must be at least 18 years of age'],
    },
    aadhaar: {
      type: String,
      required: [true, 'Aadhaar number is required'],
      unique: true,
      trim: true,
    },
    voterId: {
      type: String,
      required: [true, 'Voter ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{3}[0-9]{7}$/, 'Voter ID must be 3 capital letters followed by 7 numbers (e.g., ABC1234567)'],
    },
    passport: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
      validate: {
        validator: function(v: string) {
          if (!v) return true;
          return /^([A-Z]{2}[0-9]{6}|[A-Z][0-9]{7})$/.test(v);
        },
        message: 'Passport number must be 2 capital letters followed by 6 numbers (e.g. AB123456) or 1 capital letter followed by 7 numbers (e.g. A1234567)',
      },
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    currentPlace: {
      type: String,
      trim: true,
      default: '',
    },
    currentAddress: {
      type: String,
      trim: true,
      default: '',
    },
    currentPincode: {
      type: String,
      trim: true,
      default: '',
    },
    indianAddress: {
      type: String,
      trim: true,
      default: '',
    },
    indianState: {
      type: String,
      required: [true, 'Indian State is required'],
      trim: true,
    },
    indianDistrict: {
      type: String,
      required: [true, 'Indian District is required'],
      trim: true,
    },
    indianPlace: {
      type: String,
      trim: true,
      default: '',
    },
    assemblyConstituency: {
      type: String,
      trim: true,
      default: '',
    },
    parliamentConstituency: {
      type: String,
      trim: true,
      default: '',
    },
    constituency: {
      type: String,
      trim: true,
      default: '',
    },
    indianPincode: {
      type: String,
      trim: true,
      default: '',
    },
    hasVotedAssembly: {
      type: Boolean,
      default: false,
    },
    hasVotedParliament: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize search queries
UserSchema.index({ name: 'text', aadhaar: 1, voterId: 1, country: 1 });
UserSchema.index({ indianState: 1, indianDistrict: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
