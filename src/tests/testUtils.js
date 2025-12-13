import { jsx as _jsx } from "react/jsx-runtime";
import { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
export const renderWithRouter = (ui) => {
    return render(_jsx(MemoryRouter, { children: ui }));
};
