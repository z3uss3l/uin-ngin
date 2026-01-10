import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import UINHybridTool from '../App';

// Smoke test: ensure main tabs render and basic navigation works

describe('UINHybridTool UI layout', () => {
  test('renders tabs and navigates between Editor, Rosetta, and Export views', () => {
    render(<UINHybridTool />);

    // Tabs are present
    const editorTab = screen.getByRole('button', { name: /editor \+ preview/i });
    const rosettaTab = screen.getByRole('button', { name: /rosetta table/i });
    const exportTab = screen.getByRole('button', { name: /export/i });

    expect(editorTab).toBeInTheDocument();
    expect(rosettaTab).toBeInTheDocument();
    expect(exportTab).toBeInTheDocument();

    // Default view shows editor
    expect(screen.getByText(/uin definition/i)).toBeInTheDocument();

    // Switch to Rosetta view
    fireEvent.click(rosettaTab);
    expect(screen.getByRole('heading', { name: /rosetta table/i })).toBeInTheDocument();

    // Switch to Export view
    fireEvent.click(exportTab);
    expect(screen.getByText(/depth map \(controlnet\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send to comfyui/i })).toBeInTheDocument();
  });
});
