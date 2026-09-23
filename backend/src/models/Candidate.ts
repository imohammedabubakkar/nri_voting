import mongoose, { Document, Schema } from 'mongoose';

export type ElectionType = 'assembly' | 'parliament';

export interface ICandidate extends Document {
  name: string;
  dob: string;
  age: string;
  electionType: ElectionType;
  state: string;
  district: string;
  constituency: string;
  partyName: string;
  partySymbol: string;
  partyAbbr: string;
  partySymbolImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    dob: {
      type: String,
      required: [true, 'Date of birth is required'],
      trim: true,
    },
    age: {
      type: String,
      required: [true, 'Age is required'],
      trim: true,
    },
    electionType: {
      type: String,
      required: [true, 'Election type is required'],
      enum: ['assembly', 'parliament'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    constituency: {
      type: String,
      required: [true, 'Constituency is required'],
      trim: true,
    },
    partyName: {
      type: String,
      required: [true, 'Party name is required'],
      trim: true,
    },
    partySymbol: {
      type: String,
      default: '',
      trim: true,
    },
    partyAbbr: {
      type: String,
      default: '',
      trim: true,
    },
    partySymbolImage: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// A party cannot field multiple candidates in the same constituency for the same election
CandidateSchema.index(
  { electionType: 1, state: 1, district: 1, constituency: 1, partyName: 1 },
  { unique: true }
);

export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema);
