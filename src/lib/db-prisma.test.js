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
      employee: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      leave: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      overtime: {
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
        { id: '1', firstName: 'John', lastName: 'Doe' },
        { id: '2', firstName: 'Jane', lastName: 'Smith' },
      ];
      
      mockPrismaClient.employee.findMany.mockResolvedValue(mockEmployees);
      
      const result = await getEmployees();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmployees);
      expect(mockPrismaClient.employee.findMany).toHaveBeenCalledTimes(1);
    });
    
    test('getEmployees handles errors', async () => {
      const mockError = new Error('Database error');
      mockPrismaClient.employee.findMany.mockRejectedValue(mockError);
      
      const result = await getEmployees();
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Database error');
      expect(result.connectionError).toBe(true);
    });
    
    test('getEmployeeById returns employee by ID', async () => {
      const mockEmployee = { id: '1', firstName: 'John', lastName: 'Doe' };
      mockPrismaClient.employee.findUnique.mockResolvedValue(mockEmployee);
      
      const result = await getEmployeeById('1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmployee);
      expect(mockPrismaClient.employee.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.any(Object),
      });
    });
    
    test('getEmployeeById returns error when employee not found', async () => {
      mockPrismaClient.employee.findUnique.mockResolvedValue(null);
      
      const result = await getEmployeeById('999');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('ไม่พบข้อมูลพนักงาน');
    });
  });
  
  describe('Leave functions', () => {
    test('getLeaves returns all leaves when no employeeId provided', async () => {
      const mockLeaves = [
        { id: '1', leaveType: 'ลาป่วย', employeeId: '1' },
        { id: '2', leaveType: 'ลากิจ', employeeId: '2' },
      ];
      
      mockPrismaClient.leave.findMany.mockResolvedValue(mockLeaves);
      
      const result = await getLeaves();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLeaves);
      expect(mockPrismaClient.leave.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {},
      }));
    });
    
    test('getLeaves returns leaves for specific employee', async () => {
      const mockLeaves = [
        { id: '1', leaveType: 'ลาป่วย', employeeId: '1' },
      ];
      
      mockPrismaClient.leave.findMany.mockResolvedValue(mockLeaves);
      
      const result = await getLeaves('1');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLeaves);
      expect(mockPrismaClient.leave.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { employeeId: '1' },
      }));
    });
  });
  
  describe('Overtime functions', () => {
    test('getOvertimes returns all overtimes when no employeeId provided', async () => {
      const mockOvertimes = [
        { id: '1', date: new Date(), employeeId: '1' },
        { id: '2', date: new Date(), employeeId: '2' },
      ];
      
      mockPrismaClient.overtime.findMany.mockResolvedValue(mockOvertimes);
      
      const result = await getOvertimes();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOvertimes);
      expect(mockPrismaClient.overtime.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {},
      }));
    });
  });
  
  describe('Statistics function', () => {
    test('getStatistics returns correct statistics', async () => {
      mockPrismaClient.employee.count.mockResolvedValue(10);
      mockPrismaClient.leave.count.mockResolvedValue(5);
      mockPrismaClient.overtime.count.mockResolvedValue(3);
      
      mockPrismaClient.leave.findMany.mockResolvedValue([
        { id: '1', status: 'รออนุมัติ' },
        { id: '2', status: 'อนุมัติ' },
        { id: '3', status: 'อนุมัติ' },
        { id: '4', status: 'ไม่อนุมัติ' },
        { id: '5', status: 'รออนุมัติ' },
      ]);
      
      mockPrismaClient.overtime.findMany.mockResolvedValue([
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