export default function AdminUsers() {
  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-6'>Client Accounts</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {[1,2,3].map(i => (
          <div key={i} className='bg-white p-4 rounded shadow flex justify-between items-center'>
            <div>
              <p className='font-bold'>Client Entity {i}</p>
              <p className='text-sm text-gray-500'>client{i}@example.com</p>
            </div>
            <span className='bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs'>12 Devices</span>
          </div>
        ))}
      </div>
    </div>
  );
}
