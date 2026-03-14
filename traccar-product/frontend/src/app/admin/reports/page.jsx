export default function AdminReports() {
  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-6'>System Analytics</h1>
      <div className='grid grid-cols-2 gap-6'>
        <div className='bg-white p-6 rounded shadow'>Daily Active Users: 42</div>
        <div className='bg-white p-6 rounded shadow'>Data Processed: 1.2 GB</div>
      </div>
    </div>
  );
}
