import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

jest.mock('@uin/adapters', () => ({
  toSVG: jest.fn(() => '<svg></svg>'),
  toDepthMap: jest.fn(() => Promise.resolve('data:image/png;base64,AAA')),
  toPrompt: jest.fn(() => 'test prompt')
}));

import UINHybridTool from '../App';

describe('UINHybridTool', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'enqueued' }) }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('send button disabled until depth map available and sends to API', async () => {
    render(<UINHybridTool />);

    const sendButton = screen.getByRole('button', { name: /send to comfyui/i });
    expect(sendButton).toBeDisabled();

    // Wait for async depth map generation
    await waitFor(() => expect(global.fetch).not.toHaveBeenCalled());

    // After depth map resolves, button should be enabled
    await waitFor(() => expect(sendButton).toBeEnabled());

    fireEvent.click(sendButton);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({ body: expect.stringContaining('depthMapBase64') })));

    // Notification should appear
    expect(screen.getByText(/enqueued/i)).toBeInTheDocument();
  });
});
