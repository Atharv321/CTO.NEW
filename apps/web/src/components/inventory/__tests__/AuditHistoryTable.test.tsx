import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuditHistoryTable } from '../AuditHistoryTable';
import { StockMovement } from '@/types';

describe('AuditHistoryTable', () => {
  it('should render loading state', () => {
    render(
      <AuditHistoryTable movements={[]} isLoading={true} />
    );
    
    // Check for loader or loading indicator
    expect(screen.getByRole('status') || screen.queryByText(/loading/i)).toBeTruthy();
  });

  it('should render error state', () => {
    const error = new Error('Test error');
    render(
      <AuditHistoryTable movements={[]} error={error} />
    );
    
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });

  it('should render empty state', () => {
    render(
      <AuditHistoryTable movements={[]} />
    );
    
    expect(screen.getByText(/No audit history available/i)).toBeInTheDocument();
  });

  it('should render movements with correct columns', () => {
    const movements: StockMovement[] = [
      {
        id: '1',
        itemId: 'item-1',
        locationId: 'loc-1',
        quantity: 10,
        movementType: 'inbound',
        adjustedBy: 'John Doe',
        createdAt: '2024-01-15T10:30:00Z',
      },
    ];

    render(
      <AuditHistoryTable movements={movements} />
    );
    
    // Check for table headers
    expect(screen.getByText(/Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantity/i)).toBeInTheDocument();
    expect(screen.getByText(/Recorded By/i)).toBeInTheDocument();
  });

  it('should display movement type badge', () => {
    const movements: StockMovement[] = [
      {
        id: '1',
        itemId: 'item-1',
        locationId: 'loc-1',
        quantity: 10,
        movementType: 'inbound',
        adjustedBy: 'John Doe',
        createdAt: '2024-01-15T10:30:00Z',
      },
    ];

    render(
      <AuditHistoryTable movements={movements} />
    );
    
    expect(screen.getByText('inbound')).toBeInTheDocument();
  });

  it('should display quantity with correct icon', () => {
    const movements: StockMovement[] = [
      {
        id: '1',
        itemId: 'item-1',
        locationId: 'loc-1',
        quantity: 10,
        movementType: 'inbound',
        adjustedBy: 'John Doe',
        createdAt: '2024-01-15T10:30:00Z',
      },
    ];

    render(
      <AuditHistoryTable movements={movements} />
    );
    
    // Check for quantity
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should display formatted date', () => {
    const movements: StockMovement[] = [
      {
        id: '1',
        itemId: 'item-1',
        locationId: 'loc-1',
        quantity: 10,
        movementType: 'adjustment',
        adjustedBy: 'John Doe',
        createdAt: '2024-01-15T10:30:00Z',
      },
    ];

    render(
      <AuditHistoryTable movements={movements} />
    );
    
    // Date should be formatted
    const dateCell = screen.getByText(/2024-01-15|Jan.*15/);
    expect(dateCell).toBeInTheDocument();
  });

  it('should display multiple movements', () => {
    const movements: StockMovement[] = [
      {
        id: '1',
        itemId: 'item-1',
        locationId: 'loc-1',
        quantity: 10,
        movementType: 'inbound',
        adjustedBy: 'John Doe',
        createdAt: '2024-01-15T10:30:00Z',
      },
      {
        id: '2',
        itemId: 'item-1',
        locationId: 'loc-1',
        quantity: 5,
        movementType: 'outbound',
        adjustedBy: 'Jane Doe',
        createdAt: '2024-01-16T10:30:00Z',
      },
    ];

    render(
      <AuditHistoryTable movements={movements} />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('inbound')).toBeInTheDocument();
    expect(screen.getByText('outbound')).toBeInTheDocument();
  });
});
