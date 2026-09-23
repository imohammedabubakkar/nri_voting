import mongoose, { Document, Schema } from 'mongoose';

export type ScheduleStatus = 'scheduled' | 'active' | 'ended';

export interface IElectionSchedule extends Document {
  date: string;
  fromTime: string;
  toTime: string;
  allConstituencies: boolean;
  state?: string;
  district?: string;
  assemblyConstituency?: string;
  parliamentConstituency?: string;
  status: ScheduleStatus;
  startedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ElectionScheduleSchema = new Schema<IElectionSchedule>(
  {
    date: {
      type: String,
      required: [true, 'Election date is required'],
      trim: true,
    },
    fromTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
    },
    toTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
    },
    allConstituencies: {
      type: Boolean,
      default: true,
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    district: {
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
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended'],
      default: 'scheduled',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const ElectionSchedule = mongoose.model<IElectionSchedule>(
  'ElectionSchedule',
  ElectionScheduleSchema
);
