export default function AdminDevices() {
  const devices = [
    { id: 1, name: 'Truck-042', imei: '862345678901234', status: 'Online', model: 'Teltonika FMB120' },
    { id: 2, name: 'Van-011', imei: '862345678901255', status: 'Online', model: 'GT06' },
    { id: 3, name: 'Bike-007', imei: '862345678901288', status: 'Offline', model: 'TK103' }
  ];

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-6'>Device Management</h1>
      <div className='bg-white rounded shadow'>
        <table className='w-full text-left'>
          <thead>
            <tr className='bg-gray-100'>
              <th className='p-4'>Name</th>
              <th className='p-4'>IMEI</th>
              <th className='p-4'>Model</th>
              <th className='p-4'>Status</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(d => (
              <tr key={d.id} className='border-t'>
                <td className='p-4 font-medium'>{d.name}</td>
                <td className='p-4 text-gray-500'>{d.imei}</td>
                <td className='p-4'>{d.model}</td>
                <td className='p-4'><span className={d.status === 'Online' ? 'text-green-500 font-bold' : 'text-gray-400'}>{d.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
