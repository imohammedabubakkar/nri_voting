import { Request, Response, NextFunction } from 'express';
import { ElectionSchedule } from '../models/ElectionSchedule.js';

// Helper to determine real-time election status
function computeLiveStatus(schedule: any): 'no_election' | 'not_started' | 'active' | 'ended' {
  if (!schedule || schedule.status !== 'active') return 'no_election';

  try {
    const [year, month, day] = schedule.date.split('-').map(Number);
    const [fromH, fromM] = schedule.fromTime.split(':').map(Number);
    const [toH, toM] = schedule.toTime.split(':').map(Number);

    const now = new Date();
    const start = new Date(year, month - 1, day, fromH, fromM, 0);
    const end = new Date(year, month - 1, day, toH, toM, 0);

    if (now < start) return 'not_started';
    if (now > end) return 'ended';
    return 'active';
  } catch {
    return schedule.status;
  }
}

// Get current schedule and real-time status
export async function getSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schedule = await ElectionSchedule.findOne().sort({ createdAt: -1 });

    if (!schedule) {
      res.json({
        success: true,
        schedule: null,
        liveStatus: 'no_election',
      });
      return;
    }

    const liveStatus = computeLiveStatus(schedule);

    res.json({
      success: true,
      schedule,
      liveStatus,
    });
  } catch (error) {
    next(error);
  }
}

// Set or start election schedule
export async function setSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      date, fromTime, toTime, allConstituencies,
      state, district, assemblyConstituency, parliamentConstituency, status
    } = req.body;

    if (!date || !fromTime || !toTime) {
      res.status(400).json({
        success: false,
        message: 'Election date, start time, and end time are required.',
      });
      return;
    }

    if (fromTime >= toTime) {
      res.status(400).json({
        success: false,
        message: 'End time must be after start time.',
      });
      return;
    }

    // Replace previous schedules or create new
    await ElectionSchedule.deleteMany({});

    const newSchedule = await ElectionSchedule.create({
      date,
      fromTime,
      toTime,
      allConstituencies: allConstituencies ?? true,
      state: state || '',
      district: district || '',
      assemblyConstituency: assemblyConstituency || '',
      parliamentConstituency: parliamentConstituency || '',
      status: status || 'active',
      startedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Election schedule saved and activated successfully.',
      schedule: newSchedule,
    });
  } catch (error) {
    next(error);
  }
}

// Update schedule status (e.g. to 'ended' or 'active')
export async function updateScheduleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body;

    if (!status || !['scheduled', 'active', 'ended'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Valid status is required: scheduled, active, or ended.',
      });
      return;
    }

    const schedule = await ElectionSchedule.findOne().sort({ createdAt: -1 });

    if (!schedule) {
      res.status(404).json({ success: false, message: 'No schedule found to update.' });
      return;
    }

    schedule.status = status;
    await schedule.save();

    res.json({
      success: true,
      message: `Election status updated to "${status}".`,
      schedule,
    });
  } catch (error) {
    next(error);
  }
}

// Clear schedule
export async function deleteSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ElectionSchedule.deleteMany({});
    res.json({
      success: true,
      message: 'Election schedule cleared successfully.',
    });
  } catch (error) {
    next(error);
  }
}
