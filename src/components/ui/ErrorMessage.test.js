import { render, screen } from '@testing-library/react';
import ErrorMessage, { ConnectionErrorMessage } from './ErrorMessage';

describe('ErrorMessage Component', () => {
  test('renders error message with correct style', () => {
    render(<ErrorMessage message="เกิดข้อผิดพลาด" type="error" />);
    
    const messageElement = screen.getByText('เกิดข้อผิดพลาด');
    expect(messageElement).toBeInTheDocument();
    
    const containerElement = messageElement.closest('div');
    expect(containerElement).toHaveClass('bg-red-50');
    expect(containerElement).toHaveClass('text-red-700');
  });
  
  test('renders warning message with correct style', () => {
    render(<ErrorMessage message="คำเตือน" type="warning" />);
    
    const messageElement = screen.getByText('คำเตือน');
    expect(messageElement).toBeInTheDocument();
    
    const containerElement = messageElement.closest('div');
    expect(containerElement).toHaveClass('bg-yellow-50');
    expect(containerElement).toHaveClass('text-yellow-700');
  });
  
  test('renders info message with correct style', () => {
    render(<ErrorMessage message="ข้อมูล" type="info" />);
    
    const messageElement = screen.getByText('ข้อมูล');
    expect(messageElement).toBeInTheDocument();
    
    const containerElement = messageElement.closest('div');
    expect(containerElement).toHaveClass('bg-blue-50');
    expect(containerElement).toHaveClass('text-blue-700');
  });
  
  test('renders success message with correct style', () => {
    render(<ErrorMessage message="สำเร็จ" type="success" />);
    
    const messageElement = screen.getByText('สำเร็จ');
    expect(messageElement).toBeInTheDocument();
    
    const containerElement = messageElement.closest('div');
    expect(containerElement).toHaveClass('bg-green-50');
    expect(containerElement).toHaveClass('text-green-700');
  });
  
  test('renders with default error style when type is invalid', () => {
    render(<ErrorMessage message="ข้อความ" type="invalid-type" />);
    
    const messageElement = screen.getByText('ข้อความ');
    expect(messageElement).toBeInTheDocument();
    
    const containerElement = messageElement.closest('div');
    expect(containerElement).toHaveClass('bg-red-50');
    expect(containerElement).toHaveClass('text-red-700');
  });
  
  test('does not render when message is empty', () => {
    const { container } = render(<ErrorMessage message="" type="error" />);
    expect(container.firstChild).toBeNull();
  });
  
  test('renders ConnectionErrorMessage with correct message', () => {
    render(<ConnectionErrorMessage />);
    
    const messageElement = screen.getByText('ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ');
    expect(messageElement).toBeInTheDocument();
    
    const containerElement = messageElement.closest('div');
    expect(containerElement).toHaveClass('bg-red-50');
    expect(containerElement).toHaveClass('text-red-700');
  });
}); 