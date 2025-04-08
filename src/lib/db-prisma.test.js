import { PrismaClient } from '@prisma/client';
import {
  getEmployees,
  getEmployeeById,
  getEmployeeByEmail,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeePassword,
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
  getOvertimes,
  getOvertimeById,
  createOvertime,
  updateOvertime,
  deleteOvertime,
  getStatistics
} from './db-prisma';

// Mock PrismaClient
jest.mock('@prisma/client');

describe('db-prisma functions', () => {
  let mockPrismaClient;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup mock implementation
    mockPrismaClient = {
      employees: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      leaves: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      overtimes: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $disconnect: jest.fn(),
    };
    
    // Mock the PrismaClient constructor
    PrismaClient.mockImplementation(() => mockPrismaClient);
  });
  
  describe('Employee functions', () => {
    test('getEmployees returns all employees', async () => {
      const mockEmployees = [
        { id: '1', first_name: 'John', last_name: 'Doe' },
        { id: '2', first_name: 'Jane', last_name: 'Smith' },
      ];
      
      mockPrismaClient.employees.findMany.mockResolvedValue(mockEmployees);
      
      const result = await getEmployees();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmployees);
      expect(mockPrismaClient.employees.findMany).toHaveBeenCalledTimes(1);
    });
    
    test('getEmployees handles errors', async () => {
      const mockError = new Error('Database error');
      mockPrismaClient.employees.findMany.mockRejectedValue(mockError);
      
      const result = await getEmployees();
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Database error');
      expect(result.connectionError).toBe(true);
    });
    
    test('getEmployeeById returns employee by ID', async () => {
      const mockEmployee = { id: '1', first_name: 'John', last_name: 'Doe' };
      mockPrismaClient.employees.findUnique.mockResolvedValue(mockEmployee);
      
      const result = await getEmployeeById('1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmployee);
      expect(mockPrismaClient.employees.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.any(Object),
      });
    });
    
    test('getEmployeeById returns error when employee not found', async () => {
      mockPrismaClient.employees.findUnique.mockResolvedValue(null);
      
      const result = await getEmployeeById('999');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('ไม่พบข้อมูลพนักงาน');
    });
  });
  
  describe('Leave functions', () => {
    test('getLeaves returns all leaves when no employeeId provided', async () => {
      const mockLeaves = [
        { id: '1', leave_type: 'ลาป่วย', employee_id: '1' },
        { id: '2', leave_type: 'ลากิจ', employee_id: '2' },
      ];
      
      mockPrismaClient.leaves.findMany.mockResolvedValue(mockLeaves);
      
      const result = await getLeaves();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLeaves);
      expect(mockPrismaClient.leaves.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {},
      }));
    });
    
    test('getLeaves returns leaves for specific employee', async () => {
      const mockLeaves = [
        { id: '1', leave_type: 'ลาป่วย', employee_id: '1' },
      ];
      
      mockPrismaClient.leaves.findMany.mockResolvedValue(mockLeaves);
      
      const result = await getLeaves('1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLeaves);
      expect(mockPrismaClient.leaves.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { employee_id: '1' },
      }));
    });
  });
  
  describe('Overtime functions', () => {
    test('getOvertimes returns all overtimes when no employeeId provided', async () => {
      const mockOvertimes = [
        { id: '1', date: new Date(), employee_id: '1' },
        { id: '2', date: new Date(), employee_id: '2' },
      ];
      
      mockPrismaClient.overtimes.findMany.mockResolvedValue(mockOvertimes);
      
      const result = await getOvertimes();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOvertimes);
      expect(mockPrismaClient.overtimes.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {},
      }));
    });
  });
  
  describe('Statistics function', () => {
    test('getStatistics returns correct statistics', async () => {
      mockPrismaClient.employees.count.mockResolvedValue(10);
      mockPrismaClient.leaves.count.mockResolvedValue(5);
      mockPrismaClient.overtimes.count.mockResolvedValue(3);
      
      mockPrismaClient.leaves.findMany.mockResolvedValue([
        { id: '1', status: 'รออนุมัติ' },
        { id: '2', status: 'อนุมัติ' },
        { id: '3', status: 'อนุมัติ' },
        { id: '4', status: 'ไม่อนุมัติ' },
        { id: '5', status: 'รออนุมัติ' },
      ]);
      
      mockPrismaClient.overtimes.findMany.mockResolvedValue([
        { id: '1', status: 'รออนุมัติ' },
        { id: '2', status: 'อนุมัติ' },
        { id: '3', status: 'รออนุมัติ' },
      ]);
      
      const result = await getStatistics();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalEmployees: 10,
        totalLeaves: 5,
        totalOvertimes: 3,
        pendingLeaves: 2,
        approvedLeaves: 2,
        rejectedLeaves: 1,
        pendingOvertimes: 2,
        approvedOvertimes: 1,
        rejectedOvertimes: 0,
      });
    });
  });
}); 