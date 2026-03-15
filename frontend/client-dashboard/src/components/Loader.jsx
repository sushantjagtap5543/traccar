import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <div className="loader-container">
      <div className="loader-content">
        <Loader2 size={48} className="spinner" />
        <p>Initializing Secure Connection...</p>
      </div>

    </div>
  );
}
