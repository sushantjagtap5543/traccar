export default function ClientAlerts() {
  return (
    <div className='p-8 font-premium'>
      <h1 className='text-2xl font-bold mb-4'>My Alerts</h1>
      <div className='space-y-4'>
        <div className='bg-red-50 p-4 rounded border-l-4 border-red-500'>
          <p className='font-bold text-red-700'>Overspeed Alert</p>
          <p className='text-sm text-red-600'>Vehicle MH-12-AB-1234 reached 95km/h</p>
        </div>
      </div>
    </div>
  );
}
