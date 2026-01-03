import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

const adapters = require('@uin/adapters');
adapters.toSVG = jest.fn(() => '<svg></svg>');
adapters.toDepthMap = jest.fn(() => Promise.resolve('data:image/png;base64,AAA'));
adapters.toPrompt = jest.fn(() => 'test prompt');

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

    // switch to Export tab where the send button is rendered
    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    const sendButton = screen.getByRole('button', { name: /send to comfyui/i });
    expect(sendButton).toBeDisabled();

    // Wait for async depth map generation
    await waitFor(() => expect(global.fetch).not.toHaveBeenCalled());

    // Wait for depth map to be present (image appears when depth map ready)
    await waitFor(() => expect(screen.getByAltText(/depth map/i)).toBeInTheDocument());

    // Now the send button should be enabled
    await waitFor(() => expect(sendButton).toBeEnabled());

    fireEvent.click(sendButton);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({ body: expect.stringContaining('depthMapBase64') })));

    // Notification should appear
    await waitFor(() => expect(screen.getByText(/enqueued/i)).toBeInTheDocument());
  });
});
