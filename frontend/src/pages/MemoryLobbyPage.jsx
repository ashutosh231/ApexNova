import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Legacy /memory-lobby route — redirects to the unified Pixel Memory lobby.
 */
const MemoryLobbyPage = () => <Navigate to="/lobby/pixel-memory" replace />;

export default MemoryLobbyPage;
