import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Vote } from '../models/Vote.js';
import { User } from '../models/User.js';
import { Candidate } from '../models/Candidate.js';
import { ElectionSchedule } from '../models/ElectionSchedule.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { config } from '../config/index.js';

// Anonymize voter identifier for secret ballot
function hashVoter(aadhaar: string, electionType: string): string {
  return crypto
    .createHmac('sha256', config.jwtSecret)
    .update(`${aadhaar.trim().toLowerCase()}_${electionType}`)
    .digest('hex');
}

// Cast a vote
export async function castVote(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { candidateId, electionType } = req.body;

    if (!candidateId || !electionType || !['assembly', 'parliament'].includes(electionType)) {
      res.status(400).json({
        success: false,
        message: 'Valid candidateId and electionType ("assembly" or "parliament") are required.',
      });
      return;
    }

    // 1. Verify active election schedule & time window
    const schedule = await ElectionSchedule.findOne().sort({ createdAt: -1 });
    if (!schedule || schedule.status !== 'active') {
      res.status(403).json({
        success: false,
        message: 'No active election currently in progress. Your vote cannot be accepted.',
      });
      return;
    }

    const [year, month, day] = schedule.date.split('-').map(Number);
    const [toH, toM] = schedule.toTime.split(':').map(Number);
    const [fromH, fromM] = schedule.fromTime.split(':').map(Number);

    const now = new Date();
    const electionStart = new Date(year, month - 1, day, fromH, fromM, 0);
    const electionEnd = new Date(year, month - 1, day, toH, toM, 0);

    if (now < electionStart) {
      res.status(403).json({
        success: false,
        message: 'Election voting window has not started yet.',
      });
      return;
    }

    if (now > electionEnd) {
      res.status(403).json({
        success: false,
        message: 'Election voting window has ended. Votes can no longer be submitted.',
      });
      return;
    }

    // 2. Identify voter (from token or fallback to voterId in body if allowed)
    const voterUserId = req.user?.id || req.body.userId;
    if (!voterUserId) {
      res.status(401).json({ success: false, message: 'Voter authentication required.' });
      return;
    }

    const voter = await User.findById(voterUserId);
    if (!voter) {
      res.status(404).json({ success: false, message: 'Voter profile not found.' });
      return;
    }

    // 3. Double-voting check
    const voteKey = electionType === 'assembly' ? 'hasVotedAssembly' : 'hasVotedParliament';
    if (voter[voteKey]) {
      res.status(400).json({
        success: false,
        message: `You have already cast your vote for the ${electionType} election. Duplicate voting is prohibited.`,
      });
      return;
    }

    // 4. Verify candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Selected candidate does not exist.' });
      return;
    }

    if (candidate.electionType !== electionType) {
      res.status(400).json({
        success: false,
        message: `Candidate belongs to ${candidate.electionType} election, not ${electionType}.`,
      });
      return;
    }

    // 5. Generate anonymized voter hash (guarantees secret ballot)
    const voterHash = hashVoter(voter.aadhaar, electionType);

    // 6. Record vote
    await Vote.create({
      voterHash,
      candidateId: candidate._id,
      electionType,
      state: candidate.state,
      district: candidate.district,
      constituency: candidate.constituency,
    });

    // 7. Update voter participation status
    voter[voteKey] = true;
    await voter.save();

    res.status(201).json({
      success: true,
      message: `Your vote for ${candidate.name} (${candidate.partyName}) has been successfully cast!`,
      voter: {
        id: voter._id,
        name: voter.name,
        hasVotedAssembly: voter.hasVotedAssembly,
        hasVotedParliament: voter.hasVotedParliament,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'A vote for this election has already been recorded for this voter.',
      });
      return;
    }
    next(error);
  }
}

// Get election results
export async function getResults(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { electionType, state, district, constituency } = req.query;

    const matchQuery: any = {};
    if (electionType && typeof electionType === 'string') matchQuery.electionType = electionType;
    if (state && typeof state === 'string') matchQuery.state = state;
    if (district && typeof district === 'string') matchQuery.district = district;
    if (constituency && typeof constituency === 'string') matchQuery.constituency = constituency;

    // Aggregate votes by candidate
    const voteAggregations = await Vote.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            candidateId: '$candidateId',
            constituency: '$constituency',
            electionType: '$electionType',
          },
          voteCount: { $sum: 1 },
        },
      },
    ]);

    // Map candidate details
    const candidateIds = voteAggregations.map(v => v._id.candidateId);
    const candidates = await Candidate.find({ _id: { $in: candidateIds } });
    const candidateMap = new Map(candidates.map(c => [c._id.toString(), c]));

    // Format results grouped by constituency
    const resultsByConstituency: Record<string, any> = {};

    for (const v of voteAggregations) {
      const cId = v._id.candidateId.toString();
      const constName = v._id.constituency;
      const type = v._id.electionType;
      const key = `${type}__${constName}`;

      if (!resultsByConstituency[key]) {
        resultsByConstituency[key] = {
          electionType: type,
          constituency: constName,
          totalVotes: 0,
          candidates: [],
        };
      }

      resultsByConstituency[key].totalVotes += v.voteCount;
      const candidateInfo = candidateMap.get(cId);

      resultsByConstituency[key].candidates.push({
        candidateId: cId,
        name: candidateInfo ? candidateInfo.name : 'Unknown Candidate',
        partyName: candidateInfo ? candidateInfo.partyName : 'Unknown Party',
        partyAbbr: candidateInfo ? candidateInfo.partyAbbr : '',
        partySymbol: candidateInfo ? candidateInfo.partySymbol : '',
        partySymbolImage: candidateInfo ? candidateInfo.partySymbolImage : '',
        votes: v.voteCount,
      });
    }

    // Calculate percentage and leading candidate for each constituency
    const formatted = Object.values(resultsByConstituency).map((group: any) => {
      group.candidates.sort((a: any, b: any) => b.votes - a.votes);
      group.candidates.forEach((c: any) => {
        c.percentage = group.totalVotes > 0 ? ((c.votes / group.totalVotes) * 100).toFixed(1) : '0.0';
      });
      group.leadingCandidate = group.candidates[0] || null;
      return group;
    });

    res.json({
      success: true,
      results: formatted,
    });
  } catch (error) {
    next(error);
  }
}

// Get admin dashboard stats
export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const totalRegistered = await User.countDocuments();
    const votesCast = await Vote.countDocuments();
    const schedule = await ElectionSchedule.findOne().sort({ createdAt: -1 });

    const turnout = totalRegistered > 0 ? ((votesCast / totalRegistered) * 100).toFixed(1) : '0.0';

    res.json({
      success: true,
      stats: {
        totalRegistered,
        votesCast,
        turnoutPercentage: turnout,
        schedule,
      },
    });
  } catch (error) {
    next(error);
  }
}
