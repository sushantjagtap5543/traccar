"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { FileText, Calendar, Filter, Download, Play, Map as MapIcon } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

export default function ReportsPage() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [fromDate, setFromDate] = useState(format(new Date(Date.now() - 86400000), "yyyy-MM-dd'T'HH:mm"));
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('trips'); // trips, stops, summary

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/devices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(res.data);
      if (res.data.length > 0) setSelectedDevice(res.data[0].id);
    } catch (e) {
      toast.error('Failed to load devices');
    }
  };

  const generateReport = async () => {
    if (!selectedDevice) return toast.warning('Select a device');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/reports/${type}`, {
        params: { deviceId: selectedDevice, from: new Date(fromDate).toISOString(), to: new Date(toDate).toISOString() },
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data);
    } catch (e) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-background overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        <header className="h-16 px-8 flex items-center justify-between border-b border-border glass sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold uppercase tracking-tighter italic">IntelliReports</h2>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Controls */}
          <div className="glass p-6 rounded-2xl border border-border flex flex-wrap gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Select Vehicle</label>
              <select 
                value={selectedDevice} 
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="bg-white/5 border border-border rounded-lg px-4 py-2 text-xs outline-none w-56 block text-white"
              >
                {devices.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name} ({d.imei})</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Report Type</label>
              <div className="flex bg-white/5 p-1 rounded-lg border border-border">
                {['trips', 'stops', 'summary'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${type === t ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest text-center block">Date Range</label>
              <div className="flex items-center gap-2">
                <input 
                  type="datetime-local" 
                  value={fromDate} 
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-white/5 border border-border rounded-lg px-3 py-2 text-[10px] outline-none text-white"
                />
                <span className="text-muted text-xs">to</span>
                <input 
                  type="datetime-local" 
                  value={toDate} 
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-white/5 border border-border rounded-lg px-3 py-2 text-[10px] outline-none text-white"
                />
              </div>
            </div>

            <button 
              onClick={generateReport}
              disabled={loading}
              className="bg-primary text-white text-[10px] font-bold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 ml-auto shadow-primary/20 shadow-lg"
            >
              {loading ? 'Processing...' : 'Generate Analysis'}
            </button>
          </div>

          {/* Results Table */}
          <div className="glass rounded-2xl border border-border overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-white/5 text-muted uppercase tracking-wider">
                  <tr>
                    {type === 'trips' && (
                      <>
                        <th className="px-6 py-4 font-bold border-b border-border">Start Time</th>
                        <th className="px-6 py-4 font-bold border-b border-border">End Time</th>
                        <th className="px-6 py-4 font-bold border-b border-border">Distance</th>
                        <th className="px-6 py-4 font-bold border-b border-border">Avg Speed</th>
                        <th className="px-6 py-4 font-bold border-b border-border">Max Speed</th>
                        <th className="px-6 py-4 font-bold border-b border-border">Duration</th>
                      </>
                    )}
                    {type === 'stops' && (
                      <>
                        <th className="px-6 py-4 font-bold border-b border-border">Arrival</th>
                        <th className="px-6 py-4 font-bold border-b border-border">Departure</th>
                        <th className="px-6 py-4 font-bold border-b border-border">Duration</th>
                        <th className="px-6 py-4 font-bold border-b border-border">Address/Location</th>
                      </>
                    )}
                    {type === 'summary' && (
                      <>
                        <th className="px-6 py-4 font-bold border-b border-border">Vehicle</th>
                        <th className="px-6 py-4 font-bold border-b border-border">Total Distance</th>
                        <th className="px-6 py-4 font-bold border-b border-border">Max Speed</th>
                        <th className="px-6 py-4 font-bold border-b border-border">Avg Speed</th>
                        <th className="px-6 py-4 font-bold border-b border-border">Points</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-muted italic">
                        No data found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        {type === 'trips' && (
                          <>
                            <td className="px-6 py-4 font-medium">{format(new Date(row.startTime), 'dd MMM, HH:mm')}</td>
                            <td className="px-6 py-4 font-medium">{format(new Date(row.endTime), 'dd MMM, HH:mm')}</td>
                            <td className="px-6 py-4">{(row.distance / 1000).toFixed(2)} km</td>
                            <td className="px-6 py-4">{row.averageSpeed.toFixed(1)} km/h</td>
                            <td className="px-6 py-4 text-red-400 font-bold">{row.maxSpeed.toFixed(1)} km/h</td>
                            <td className="px-6 py-4 text-muted">{(row.duration / 1000 / 60).toFixed(0)} mins</td>
                          </>
                        )}
                        {type === 'stops' && (
                          <>
                            <td className="px-6 py-4 font-medium">{format(new Date(row.startTime), 'dd MMM, HH:mm')}</td>
                            <td className="px-6 py-4 font-medium">{format(new Date(row.endTime), 'dd MMM, HH:mm')}</td>
                            <td className="px-6 py-4 text-muted">{(row.duration / 1000 / 60).toFixed(0)} mins</td>
                            <td className="px-6 py-4">{row.address || 'Unknown Location'}</td>
                          </>
                        )}
                        {type === 'summary' && (
                          <>
                            <td className="px-6 py-4 font-bold">{row.deviceName}</td>
                            <td className="px-6 py-4">{(row.distance / 1000).toFixed(1)} km</td>
                            <td className="px-6 py-4 text-red-400">{(row.maxSpeed * 1.852).toFixed(1)} km/h</td>
                            <td className="px-6 py-4">{(row.averageSpeed * 1.852).toFixed(1)} km/h</td>
                            <td className="px-6 py-4">{row.engineHours ? (row.engineHours / 1000 / 3600).toFixed(1) + ' hrs' : 'N/A'}</td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
