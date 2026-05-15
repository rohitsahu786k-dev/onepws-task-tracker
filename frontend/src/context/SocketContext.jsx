import React, { createContext, useContext, useMemo, useState } from 'react';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const value = useMemo(() => ({ socket, setSocket, connected: Boolean(socket?.connected) }), [socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocketContext must be used inside SocketProvider');
  return context;
};

export { SocketContext };
export default SocketProvider;
