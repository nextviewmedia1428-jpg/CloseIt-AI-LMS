'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSimulatorStore } from '@/store/simulatorStore';
import { useState } from 'react';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  budget: z.string().min(1, 'Required'),
  timelineDays: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

export function LeadRegistrationForm() {
  const { leads, day, config, addLead, randomIntent } = useSimulatorStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    // dedup by email
    if (leads.some(l => l.email.toLowerCase() === data.email.toLowerCase())) {
      setSuccess('⚠ Lead with this email already exists.');
      setTimeout(() => setSuccess(''), 3000);
      return;
    }
    setLoading(true);
    const intentSignal = randomIntent();
    const res = await fetch('/api/leads/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, budget: Number(data.budget), timelineDays: Number(data.timelineDays), intentSignal, currentDay: day, config }),
    });
    const { lead } = await res.json();
    addLead(lead);
    setSuccess(`✓ ${lead.name} registered — scored ${lead.score}/10 (${lead.classification})`);
    reset();
    setLoading(false);
    setTimeout(() => setSuccess(''), 4000);
  };

  const inp = 'w-full bg-ink/5 border border-ink/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pulse placeholder:text-ink/30 font-mono';
  const err = 'text-ember text-xs mt-0.5';

  return (
    <div className="bg-paper border border-ink/10 rounded-2xl p-5">
      <h3 className="font-display font-semibold text-sm text-ink/70 uppercase tracking-widest mb-4">
        Register Lead {leads.length < 3 && <span className="text-ember">({3 - leads.length} more required)</span>}
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input {...register('name')} placeholder="Full name *" className={inp} />
            {errors.name && <p className={err}>{errors.name.message}</p>}
          </div>
          <div>
            <input {...register('email')} placeholder="Email *" className={inp} />
            {errors.email && <p className={err}>{errors.email.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input {...register('phone')} placeholder="Phone" className={inp} />
          <input {...register('company')} placeholder="Company" className={inp} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input {...register('budget')} type="number" placeholder="Budget ($) *" className={inp} />
            {errors.budget && <p className={err}>{errors.budget.message}</p>}
          </div>
          <div>
            <input {...register('timelineDays')} type="number" placeholder="Need in X days *" className={inp} />
            {errors.timelineDays && <p className={err}>{errors.timelineDays.message}</p>}
          </div>
        </div>
        {success && (
          <p className={`text-xs font-mono ${success.startsWith('⚠') ? 'text-amber' : 'text-signal'}`}>{success}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-ink text-paper text-sm font-semibold hover:bg-ink/80 transition-colors disabled:opacity-50"
        >
          {loading ? 'Registering…' : 'Register Lead'}
        </button>
      </form>
    </div>
  );
}
