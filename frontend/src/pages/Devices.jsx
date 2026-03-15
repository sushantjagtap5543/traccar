import { useEffect, useState } from "react";
import { getDevices } from "../services/deviceService";
import DeviceCard from "../components/DeviceCard";
import Loader from "../components/Loader";
import { Plus, Search, Filter } from "lucide-react";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await getDevices();
        setDevices(data);
      } catch (err) {
        console.error("Failed to fetch devices", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.uniqueId.includes(search)
  );

  if (loading) return <Loader />;

  return (
    <div className="devices-page animate-fade-in">
      <header className="page-header">
        <div className="header-info">
          <h2>My Devices</h2>
          <p>Manage and configure your tracking fleet</p>
        </div>
        <button className="btn-primary add-btn">
          <Plus size={20} /> Add New Device
        </button>
      </header>

      <div className="filters-bar glass">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name or unique ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <button className="filter-btn"><Filter size={18} /> Filters</button>
        </div>
      </div>

      <div className="devices-grid">
        {filteredDevices.map(device => (
          <DeviceCard key={device.id} device={device} />
        ))}
        {filteredDevices.length === 0 && (
          <div className="empty-state">
            <p>No devices found matching your search.</p>
          </div>
        )}
      </div>

    </div>
  );
}
