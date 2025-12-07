import { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

export const renderWithRouter = (ui: ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

