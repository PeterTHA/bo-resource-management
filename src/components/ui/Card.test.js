import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';

describe('Card Components', () => {
  test('renders Card with children and custom className', () => {
    render(
      <Card className="custom-class">
        <div>Card Content</div>
      </Card>
    );
    
    const cardElement = screen.getByText('Card Content').closest('div');
    expect(cardElement).toHaveClass('bg-white');
    expect(cardElement).toHaveClass('rounded-xl');
    expect(cardElement).toHaveClass('shadow-md');
    expect(cardElement).toHaveClass('custom-class');
  });
  
  test('renders CardHeader with title and subtitle', () => {
    render(
      <CardHeader 
        title="Card Title" 
        subtitle="Card Subtitle" 
      />
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
    
    const headerElement = screen.getByText('Card Title').closest('div').parentElement;
    expect(headerElement).toHaveClass('bg-primary-200');
    expect(headerElement).toHaveClass('border-b');
  });
  
  test('renders CardHeader with icon', () => {
    const mockIcon = <span data-testid="mock-icon">Icon</span>;
    
    render(
      <CardHeader 
        title="Card Title" 
        icon={mockIcon}
      />
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });
  
  test('renders CardContent with children and custom className', () => {
    render(
      <CardContent className="custom-content-class">
        <div>Content Text</div>
      </CardContent>
    );
    
    const contentElement = screen.getByText('Content Text').closest('div');
    expect(contentElement).toHaveClass('px-6');
    expect(contentElement).toHaveClass('py-4');
    expect(contentElement).toHaveClass('custom-content-class');
  });
  
  test('renders CardFooter with children and custom className', () => {
    render(
      <CardFooter className="custom-footer-class">
        <div>Footer Text</div>
      </CardFooter>
    );
    
    const footerElement = screen.getByText('Footer Text').closest('div');
    expect(footerElement).toHaveClass('px-6');
    expect(footerElement).toHaveClass('py-3');
    expect(footerElement).toHaveClass('bg-gray-100');
    expect(footerElement).toHaveClass('border-t');
    expect(footerElement).toHaveClass('custom-footer-class');
  });
}); 