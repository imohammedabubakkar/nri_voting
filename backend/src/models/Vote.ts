import mongoose, { Document, Schema } from 'mongoose';

export interface IVote extends Document {
  voterHash: string;
  candidateId: mongoose.Types.ObjectId;
  electionType: 'assembly' | 'parliament';
  state: string;
  district: string;
  constituency: string;
  votedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    voterHash: {
      type: String,
      required: true,
      trim: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    electionType: {
      type: String,
      required: true,
      enum: ['assembly', 'parliament'],
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    constituency: {
      type: String,
      required: true,
      trim: true,
    },
    votedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// DB-level guarantee: A voter can cast at most 1 vote per election type
VoteSchema.index({ voterHash: 1, electionType: 1 }, { unique: true });
// Index for fast result aggregation
VoteSchema.index({ electionType: 1, constituency: 1, candidateId: 1 });

export const Vote = mongoose.model<IVote>('Vote', VoteSchema);
