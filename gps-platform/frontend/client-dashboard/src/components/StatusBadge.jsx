import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import socketService from "../services/socketService";

export default function StatusBadge() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    // Initial check
    if (socketService.socket && socketService.socket.connected) {
      setIsConnected(true);
    }

    socketService.on("connect", handleConnect);
    socketService.on("disconnect", handleDisconnect);

    return () => {
      // Logic for removing listeners if needed, 
      // though socketService.on manages its own internal Map
    };
  }, []);

  return (
    <div className={`status-badge ${isConnected ? "online" : "offline"}`}>
      {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
      <span>{isConnected ? "Live Connection" : "Reconnecting..."}</span>

    </div>
  );
}
