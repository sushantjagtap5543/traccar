export default function DeviceStatus() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Device Health</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="font-semibold text-gray-700">Vehicle {i}00</h3>
            <div className="mt-2 flex justify-between items-center text-sm">
              <span className="text-gray-500">Battery</span>
              <span className="font-medium">85%</span>
            </div>
            <div className="mt-1 flex justify-between items-center text-sm">
              <span className="text-gray-500">Signal</span>
              <span className="font-medium text-blue-500">Strong</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
