export default function AdminAlerts() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">System Alerts</h1>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Severity</th>
              <th className="p-4">Device</th>
              <th className="p-4">Message</th>
              <th className="p-4">Time</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-4"><span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">CRITICAL</span></td>
              <td className="p-4">Truck-042</td>
              <td className="p-4">Power Cut Detected</td>
              <td className="p-4">2 mins ago</td>
            </tr>
            <tr className="border-t">
              <td className="p-4"><span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded text-xs">WARNING</span></td>
              <td className="p-4">Van-011</td>
              <td className="p-4">Overspeed (94 km/h)</td>
              <td className="p-4">15 mins ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
