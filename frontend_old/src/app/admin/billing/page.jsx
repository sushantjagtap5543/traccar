export default function AdminBilling() {
  const invoices = [
    { id: 'INV-001', client: 'Alpha Logistics', amount: '.00', status: 'Paid', date: '2026-03-01' },
    { id: 'INV-002', client: 'Beta Trans', amount: ',200.00', status: 'Pending', date: '2026-03-10' }
  ];
  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-6'>Billing & Invoices</h1>
      <div className='bg-white rounded shadow p-4'>
        {invoices.map(inv => (
          <div key={inv.id} className='flex justify-between border-b py-3'>
            <span>{inv.id} - {inv.client}</span>
            <span className='font-bold'>{inv.amount}</span>
            <span className={inv.status==='Paid' ? 'text-green-500' : 'text-amber-500'}>{inv.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
