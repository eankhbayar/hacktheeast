import { body, param, ValidationChain } from 'express-validator';

const VALID_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createScheduleValidator: ValidationChain[] = [
  param('childId').isUUID().withMessage('Valid childId is required'),
  body('intervalMinutes')
    .isInt({ min: 5, max: 120 })
    .withMessage('Interval must be between 5 and 120 minutes'),
  body('activeDays')
    .isArray({ min: 1 })
    .withMessage('At least one active day is required'),
  body('activeDays.*')
    .isIn(VALID_DAYS)
    .withMessage(`Each day must be one of: ${VALID_DAYS.join(', ')}`),
  body('activeStartTime')
    .matches(TIME_REGEX)
    .withMessage('Start time must be in HH:MM format (24h)'),
  body('activeEndTime')
    .matches(TIME_REGEX)
    .withMessage('End time must be in HH:MM format (24h)'),
];

export const updateScheduleValidator: ValidationChain[] = [
  param('childId').isUUID().withMessage('Valid childId is required'),
  body('intervalMinutes').optional().isInt({ min: 5, max: 120 }),
  body('activeDays').optional().isArray({ min: 1 }),
  body('activeDays.*').optional().isIn(VALID_DAYS),
  body('activeStartTime').optional().matches(TIME_REGEX),
  body('activeEndTime').optional().matches(TIME_REGEX),
  body('isEnabled').optional().isBoolean(),
];
