import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { HelpCircle, ChevronDown, MessageSquare, Plus, Send } from 'lucide-react';

const FAQS = [
  { q: 'What is VoltGrid and how does it work?', a: 'VoltGrid is a subscription-based solar energy platform. Instead of buying expensive solar hardware, you subscribe to a monthly plan. For Consumers, we allocate solar power from our network or install rooftop systems. For Prosumers, we help you connect your solar system to the grid and pay you for the energy you export.' },
  { q: 'How is my bill calculated as a Consumer?', a: 'Your bill = Grid Import cost + Service Fee + GST − Solar Credit. The Solar Credit offsets energy consumed from your allocated or installed solar system, significantly reducing your net payable amount compared to a traditional DISCOM bill.' },
  { q: 'When do Prosumers receive their payouts?', a: 'Payouts are processed on the 7th of every month for the previous month\'s generation. The feed-in tariff rate is ₹7.50 per kWh exported to the grid. You can track pending and paid payouts on the Earnings page.' },
  { q: 'What happens during a power outage?', a: 'Our Outage Intelligence System (OIS) detects grid failures in real time. Consumers on the Hybrid Pro plan automatically switch to battery backup, maintaining uninterrupted power. The OIS alerts you via in-app notifications and automatically resolves once the grid is restored.' },
  { q: 'Can I switch my subscription plan?', a: 'Yes! You can switch between Virtual Solar, Rooftop Solar, and Hybrid Pro at any time from the Plans page. Plan changes take effect at the start of your next billing cycle. Downgrading from Rooftop to Virtual does not remove installed hardware.' },
];

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid rgba(0,212,170,0.12)', borderRadius: '10px', overflow: 'hidden', transition: 'all 0.2s', marginBottom: '0.75rem' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', padding: '1rem 1.25rem', background: open ? 'rgba(0,212,170,0.06)' : 'rgba(255,255,255,0.02)', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: '#e2e8f0', textAlign: 'left', gap: '1rem' }}>
        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{faq.q}</span>
        <ChevronDown size={16} color="#00d4aa" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.25s' }} />
      </button>
      {open && (
        <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(0,0,0,0.2)', fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.7, borderTop: '1px solid rgba(0,212,170,0.08)' }}>
          {faq.a}
        </div>
      )}
    </div>
  );
}

export default function Support() {
  const { addToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ subject: '', description: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');

  useEffect(() => {
    axios.get('/api/support/tickets').then(r => setTickets(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.description) { addToast('Please fill in all fields', 'error'); return; }
    const { data } = await axios.post('/api/support/tickets', form);
    setTickets(prev => [data, ...prev]);
    setForm({ subject: '', description: '' });
    addToast('🎫 Support ticket submitted! We\'ll get back to you within 24 hours.');
  };

  const handleChat = () => {
    setChatOpen(true);
    addToast('💬 Connecting you to a support agent...');
    setTimeout(() => addToast('✅ Agent connected! They\'ll assist you shortly.'), 2500);
  };

  const statusColor = { 'In Progress': 'badge-yellow', Resolved: 'badge-green', Closed: 'badge-teal' };

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '900px', margin: '0 auto', paddingTop: '5rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>Support</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>FAQs, raise a ticket, or chat with us</p>
        </div>
        <button onClick={handleChat} className="btn-teal" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={15} /> Live Chat
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* FAQ */}
        <div>
          <div style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={16} color="#00d4aa" /> Frequently Asked Questions
          </div>
          {FAQS.map((faq, i) => <FAQItem key={i} faq={faq} />)}
        </div>

        {/* Ticket form + list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-card">
            <div style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} color="#00d4aa" /> Raise a Ticket
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label>Subject</label>
                <input type="text" placeholder="Brief description of your issue" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div>
                <label>Description</label>
                <textarea rows={4} placeholder="Describe your issue in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <button type="submit" className="btn-teal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Send size={14} /> Submit Ticket
              </button>
            </form>
          </div>

          {/* Open tickets */}
          {tickets.length > 0 && (
            <div className="glass-card">
              <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>My Tickets</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tickets.map(t => (
                  <div key={t.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '0.875rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#e2e8f0', marginBottom: '0.2rem' }}>{t.subject}</div>
                        <div style={{ fontSize: '0.72rem', color: '#4a6080' }}>{new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                      </div>
                      <span className={`badge ${statusColor[t.status] || 'badge-teal'}`}>{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
