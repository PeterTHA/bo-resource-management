import { authOptions } from './auth';
import { getEmployeeByEmail } from './db-prisma';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('./db-prisma', () => ({
  getEmployeeByEmail: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('Auth Options', () => {
  let mockCredentials;
  let mockUser;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock data
    mockCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };
    
    mockUser = {
      id: '1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      password: 'hashed_password',
      role: 'admin',
      employee_id: 'EMP001',
      departments: 'IT',
      position: 'Developer',
      image: 'profile.jpg',
    };
  });
  
  describe('CredentialsProvider', () => {
    test('authorize returns user data when credentials are valid', async () => {
      // Mock successful DB response
      getEmployeeByEmail.mockResolvedValue({
        success: true,
        data: mockUser,
      });
      
      // Mock successful password comparison
      bcrypt.compare.mockResolvedValue(true);
      
      // Get the authorize function
      const authorize = authOptions.providers[0].authorize;
      
      // Call the authorize function
      const result = await authorize(mockCredentials);
      
      // Verify the result
      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin',
        employee_id: 'EMP001',
        departments: 'IT',
        position: 'Developer',
        image: 'profile.jpg',
      });
      
      // Verify the mocks were called correctly
      expect(getEmployeeByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
    });
    
    test('authorize returns null when email is missing', async () => {
      const authorize = authOptions.providers[0].authorize;
      const result = await authorize({ password: 'password123' });
      
      expect(result).toBeNull();
      expect(getEmployeeByEmail).not.toHaveBeenCalled();
    });
    
    test('authorize returns null when password is missing', async () => {
      const authorize = authOptions.providers[0].authorize;
      const result = await authorize({ email: 'test@example.com' });
      
      expect(result).toBeNull();
      expect(getEmployeeByEmail).not.toHaveBeenCalled();
    });
    
    test('authorize returns null when user is not found', async () => {
      getEmployeeByEmail.mockResolvedValue({
        success: false,
        message: 'User not found',
      });
      
      const authorize = authOptions.providers[0].authorize;
      const result = await authorize(mockCredentials);
      
      expect(result).toBeNull();
      expect(getEmployeeByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
    
    test('authorize returns null when password is incorrect', async () => {
      getEmployeeByEmail.mockResolvedValue({
        success: true,
        data: mockUser,
      });
      
      bcrypt.compare.mockResolvedValue(false);
      
      const authorize = authOptions.providers[0].authorize;
      const result = await authorize(mockCredentials);
      
      expect(result).toBeNull();
      expect(getEmployeeByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
    });
    
    test('authorize returns null when an error occurs', async () => {
      getEmployeeByEmail.mockRejectedValue(new Error('Database error'));
      
      const authorize = authOptions.providers[0].authorize;
      const result = await authorize(mockCredentials);
      
      expect(result).toBeNull();
      expect(getEmployeeByEmail).toHaveBeenCalledWith('test@example.com');
    });
  });
  
  describe('Callbacks', () => {
    test('jwt callback adds user data to token', () => {
      const token = {};
      const user = {
        id: '1',
        role: 'admin',
        first_name: 'Test',
        last_name: 'User',
        employee_id: 'EMP001',
        departments: 'IT',
        position: 'Developer',
      };
      
      const result = authOptions.callbacks.jwt({ token, user });
      
      expect(result).toEqual({
        id: '1',
        role: 'admin',
        first_name: 'Test',
        last_name: 'User',
        employee_id: 'EMP001',
        departments: 'IT',
        position: 'Developer',
      });
    });
    
    test('jwt callback returns token when user is not provided', () => {
      const token = { id: '1', role: 'admin' };
      
      const result = authOptions.callbacks.jwt({ token });
      
      expect(result).toEqual(token);
    });
    
    test('session callback adds token data to session', () => {
      const session = { user: {} };
      const token = {
        id: '1',
        role: 'admin',
        first_name: 'Test',
        last_name: 'User',
        employee_id: 'EMP001',
        departments: 'IT',
        position: 'Developer',
      };
      
      const result = authOptions.callbacks.session({ session, token });
      
      expect(result).toEqual({
        user: {
          id: '1',
          role: 'admin',
          first_name: 'Test',
          last_name: 'User',
          employee_id: 'EMP001',
          departments: 'IT',
          position: 'Developer',
        },
      });
    });
    
    test('session callback returns session when token is not provided', () => {
      const session = { user: { name: 'Test User' } };
      
      const result = authOptions.callbacks.session({ session });
      
      expect(result).toEqual(session);
    });
  });
}); 