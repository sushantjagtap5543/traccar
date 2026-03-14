export default function ClientMap() {
  return (
    <div className="h-screen w-full relative">
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg">
        <h1 className="text-xl font-bold">Live Tracking</h1>
        <p className="text-sm text-gray-500">6 Vehicles Active</p>
      </div>
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500 italic">Map Component (MapLibre-GL) Loader...</p>
      </div>
    </div>
  );
}
