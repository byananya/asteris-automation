// Mock logger for testing
import { jest } from '@jest/globals';

const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  silly: jest.fn()
};

export default mockLogger;
