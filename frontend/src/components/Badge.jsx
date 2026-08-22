export default function Badge({ status }) {
  const key = (status || '').toLowerCase().replace(/\s+/g, '');
  const map = {
    pending: 'pending', awaitingapproval: 'awaiting', cancelled: 'cancelled',
    noshow: 'cancelled', rejected: 'rejected', unpaid: 'unpaid',
    collected: 'collected', paid: 'paid', confirmed: 'confirmed', completed: 'completed',
  };
  return <span className={`badge ${map[key] || ''}`}>{status}</span>;
}
