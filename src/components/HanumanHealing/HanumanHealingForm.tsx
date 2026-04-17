'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { uploadPDFToGitHub } from '@/lib/github';
import { postToSheet } from '@/lib/api';

interface Props {
  onClose: () => void;
}

// ─── Signature Canvas ─────────────────────────────────────────────────────────

function SignatureCanvas({ onSign }: { onSign: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  const getPos = (e: MouseEvent | Touch, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'clientX' in e ? e.clientX : (e as Touch).clientX;
    const clientY = 'clientY' in e ? e.clientY : (e as Touch).clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    drawing.current = true;
    ctx.beginPath(); ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((x: number, y: number) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.lineTo(x, y); ctx.stroke();
    setHasStrokes(true);
    onSign(canvas.toDataURL('image/png'));
  }, [onSign]);

  const stopDraw = useCallback(() => { drawing.current = false; }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    const onMouseDown = (e: MouseEvent) => { const p = getPos(e, canvas); startDraw(p.x, p.y); };
    const onMouseMove = (e: MouseEvent) => { const p = getPos(e, canvas); draw(p.x, p.y); };
    const onTouchStart = (e: TouchEvent) => { e.preventDefault(); const p = getPos(e.touches[0], canvas); startDraw(p.x, p.y); };
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); const p = getPos(e.touches[0], canvas); draw(p.x, p.y); };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', stopDraw);
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', stopDraw);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', stopDraw);
    };
  }, [startDraw, draw, stopDraw]);

  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false); onSign('');
  };

  return (
    <div>
      <div className="relative border-2 border-dashed border-purple-300 rounded-xl overflow-hidden bg-white">
        <canvas ref={canvasRef} width={600} height={150} className="w-full h-32 touch-none cursor-crosshair" />
        {!hasStrokes && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-300 text-sm">Sign here with your finger or mouse</p>
          </div>
        )}
      </div>
      {hasStrokes && (
        <button onClick={clear} className="mt-1 text-xs text-gray-400 hover:text-red-500 transition-colors">✕ Clear signature</button>
      )}
    </div>
  );
}

// ─── PDF Generator ────────────────────────────────────────────────────────────

async function generateConsentPDF(
  name: string, email: string, phone: string,
  challenges: string,
  meditationDays: string, dreamCount: string, conceptsAware: string,
  mentorName: string, mentorPhone: string,
  recordingConsent: boolean,
  signatureDataUrl: string,
  date: string
): Promise<string> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 170; const LM = 20; let y = 15;

  const line = (h = 5) => { y += h; };
  const rule = () => { doc.setDrawColor(180); doc.line(LM, y, LM + W, y); line(4); };

  const bullet = (text: string) => {
    const lines = doc.splitTextToSize('• ' + text, W - 4);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(lines, LM + 4, y);
    line(lines.length * 4.5 + 1);
  };

  const sectionHeader = (title: string) => {
    doc.setFillColor(72, 52, 150);
    doc.rect(LM, y, W, 7, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(title, LM + 2, y + 5);
    line(10); doc.setTextColor(30, 30, 30);
  };

  // Header
  doc.setFillColor(72, 52, 150); doc.rect(LM - 5, y - 5, W + 10, 18, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
  doc.text('HANUMAN HEALING', LM + W / 2, y + 5, { align: 'center' });
  line(10);
  doc.setFontSize(11); doc.setFont('helvetica', 'italic');
  doc.text('Participant Consent & Acknowledgment Form', LM + W / 2, y + 2, { align: 'center' });
  line(5);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Please read carefully before your session', LM + W / 2, y + 2, { align: 'center' });
  line(12);

  // Participant Details
  doc.setTextColor(30, 30, 30);
  sectionHeader('PARTICIPANT DETAILS');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Full Legal Name:', LM, y); doc.setFont('helvetica', 'normal'); doc.text(name, LM + 34, y); rule();
  doc.setFont('helvetica', 'bold'); doc.text('Email:', LM, y); doc.setFont('helvetica', 'normal'); doc.text(email || '—', LM + 14, y); rule();
  doc.setFont('helvetica', 'bold'); doc.text('Phone:', LM, y); doc.setFont('helvetica', 'normal'); doc.text(phone, LM + 14, y); rule();
  if (challenges.trim()) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('Challenges / Intentions:', LM, y); line(5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    const cLines = doc.splitTextToSize(challenges, W - 2);
    doc.text(cLines, LM, y); line(cLines.length * 4.5 + 3);
  }
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold'); doc.text('Days of 4P Meditation:', LM, y); doc.setFont('helvetica', 'normal'); doc.text(meditationDays || '—', LM + 48, y); rule();
  doc.setFont('helvetica', 'bold'); doc.text('Dreams Received:', LM, y); doc.setFont('helvetica', 'normal'); doc.text(dreamCount || '—', LM + 36, y); rule();
  doc.setFont('helvetica', 'bold'); doc.text('Aware of WayToMoksha Concepts:', LM, y); doc.setFont('helvetica', 'normal'); doc.text(conceptsAware ? conceptsAware.toUpperCase() : '—', LM + 68, y); rule();
  if (mentorName.trim()) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text('Mentor Name:', LM, y); doc.setFont('helvetica', 'normal'); doc.text(mentorName, LM + 28, y); rule();
    doc.setFont('helvetica', 'bold'); doc.text('Mentor Phone:', LM, y); doc.setFont('helvetica', 'normal'); doc.text(mentorPhone || '—', LM + 28, y); rule();
  }
  line(3);

  // Sections 1–4
  sectionHeader('1.  INTRODUCTION & PURPOSE');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  const introText = 'Welcome to Hanuman Healing — a guided group meditation experience designed to support personal reflection, inner awareness, and holistic well-being. In this session, a group of trained meditators will gather with focused intention to support your healing process, holding a meditative space on your behalf while you rest quietly and comfortably. This practice is open to people of all backgrounds and does not require any particular religious belief or spiritual affiliation.';
  const introLines = doc.splitTextToSize(introText, W - 2);
  doc.text(introLines, LM, y); line(introLines.length * 4.5 + 3);

  sectionHeader('2.  NATURE OF THE SESSION');
  bullet('Before the session you will be invited to share your concerns or intentions. This is voluntary.');
  bullet('During the session you will lie down in a calm, quiet setting while mediators participate in a guided meditation focused on your well-being.');
  bullet('Mediators may experience intuitive impressions, sensations, imagery, or insights during the meditation — these are their personal subjective experiences.');
  bullet('After the session, mediators will share their observations and the facilitators will collectively reflect on these insights.');
  bullet('Suggestions or guidance may be offered. You are free to receive, consider, or set aside any insights shared.');
  line(2);

  sectionHeader('3.  VOLUNTARY PARTICIPATION');
  doc.setFillColor(240, 235, 255);
  const volText = 'Your participation in this session is entirely voluntary. You have the right to withdraw or stop at any point before, during, or after the session — without explanation and without any negative consequence.';
  const volLines = doc.splitTextToSize(volText, W - 4);
  doc.rect(LM, y, W, volLines.length * 4.5 + 6, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(60, 20, 120);
  doc.text(volLines, LM + 2, y + 4); line(volLines.length * 4.5 + 8); doc.setTextColor(30, 30, 30);

  sectionHeader('4.  NON-MEDICAL DISCLAIMER');
  bullet('Hanuman Healing is a spiritual and wellness practice only. It is not a medical treatment, psychological therapy, or professional counseling service.');
  bullet('This session does not constitute medical, psychiatric, psychological, therapeutic, or clinical advice of any kind.');
  bullet('The insights and suggestions shared are not diagnoses, treatment plans, or medical recommendations.');
  bullet('If you are experiencing a medical condition, mental health concern, or personal crisis, please consult a licensed physician or appropriate care provider.');
  line(2);

  // Page 2
  doc.addPage(); y = 20;

  sectionHeader('5.  CONFIDENTIALITY');
  bullet('Personal information you share will be treated with discretion and respect by all facilitators and mediators present.');
  bullet('Your information will not be shared outside of the healing circle without your written consent.');
  bullet('Anonymized insights may be discussed for internal learning — but your name and identifying details will not be used.');
  line(2);

  sectionHeader('6.  CONSENT TO SHARE INSIGHTS');
  bullet('The insights shared by mediators are their personal subjective experiences and are not presented as objective facts, predictions, or professional guidance.');
  bullet('You have complete freedom to receive, interpret, or disregard any insights offered.');
  bullet('The facilitators\' collective reflection is offered in the spirit of care and support — not as authoritative direction.');
  line(2);

  sectionHeader('7.  EMOTIONAL RESPONSIBILITY');
  bullet('Emotional material may arise during or after the session, and this is a natural part of reflective and meditative work.');
  bullet('You take personal responsibility for your emotional well-being during and after the session.');
  bullet('The facilitators and mediators are not licensed therapists — their role is to hold a supportive meditative space.');
  line(2);

  sectionHeader('8.  NO GUARANTEED OUTCOMES');
  doc.setFillColor(240, 235, 255);
  const ngText = 'Hanuman Healing makes no guarantees, promises, or warranties regarding the results of participation. Outcomes are entirely subjective and vary from person to person. No representation is made that this practice will cure, treat, prevent, or alleviate any physical, mental, emotional, or spiritual condition.';
  const ngLines = doc.splitTextToSize(ngText, W - 4);
  doc.rect(LM, y, W, ngLines.length * 4.5 + 6, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(60, 20, 120);
  doc.text(ngLines, LM + 2, y + 4); line(ngLines.length * 4.5 + 8); doc.setTextColor(30, 30, 30);

  sectionHeader('9.  RELEASE OF LIABILITY');
  bullet('By signing this form, you agree to release, discharge, and hold harmless the Hanuman Healing facilitators, mediators, organizers, and hosts from any and all claims, demands, damages, or liabilities arising from your participation.');
  bullet('This release includes emotional responses, decisions based on insights, physical discomfort, or any outcome from participation.');
  bullet('This release does not apply in cases of gross negligence or willful misconduct.');
  line(2);

  sectionHeader('10.  RECORDING (OPTIONAL CONSENT)');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text('Certain sessions may be recorded for internal learning and facilitator training only. No recordings will be shared publicly.', LM, y, { maxWidth: W }); line(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`[${recordingConsent ? 'X' : '  '}] YES — I consent to this session being recorded for internal training and learning purposes only.`, LM + 2, y); line(6);
  doc.text(`[${!recordingConsent ? 'X' : '  '}] NO — I do not consent to recording.`, LM + 2, y); line(8);

  // Affirmation
  doc.setFillColor(240, 235, 255);
  const affText = 'I have read and understood this consent form in its entirety. I am participating in the Hanuman Healing session freely and of my own accord. I understand that this is a spiritual wellness practice — not a medical or psychological service — and I accept personal responsibility for my experience and well-being. I acknowledge that no specific outcomes are promised or guaranteed, and that I may withdraw from the session at any time without consequence.';
  const affLines = doc.splitTextToSize(affText, W - 4);
  doc.rect(LM, y, W, affLines.length * 4.5 + 6, 'F');
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(60, 20, 120);
  doc.text(affLines, LM + 2, y + 4); line(affLines.length * 4.5 + 10);

  // Signature section
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Full Legal Name (Print)', LM, y); doc.text('Date', LM + 100, y); line(5);
  doc.setFont('helvetica', 'normal');
  doc.text(name, LM, y); doc.text(date, LM + 100, y); rule();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Participant Signature', LM, y); line(3);
  if (signatureDataUrl) {
    doc.addImage(signatureDataUrl, 'PNG', LM, y, 80, 20);
    line(22);
  }
  rule();

  doc.setFont('helvetica', 'bold'); doc.text('Email Address', LM, y); line(5);
  doc.setFont('helvetica', 'normal'); doc.text(email || '—', LM, y); rule();

  // Footer
  doc.setFillColor(72, 52, 150);
  doc.rect(LM - 5, y + 5, W + 10, 10, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'italic');
  doc.text('HANUMAN HEALING  •  WayToMoksha  •  www.waytomoksha.org', LM + W / 2, y + 11, { align: 'center' });

  return doc.output('datauristring').split(',')[1];
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Step = 'form' | 'consent';

export default function HanumanHealingForm({ onClose }: Props) {
  const [step, setStep] = useState<Step>('form');

  // Registration fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [challenges, setChallenges] = useState('');
  const [meditationDays, setMeditationDays] = useState('');
  const [dreamCount, setDreamCount] = useState('');
  const [conceptsAware, setConceptsAware] = useState<'yes' | 'no' | ''>('');
  const [mentorName, setMentorName] = useState('');
  const [mentorPhone, setMentorPhone] = useState('');
  const [error, setError] = useState('');

  // Consent fields
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleRegister = () => {
    if (!fullName.trim()) { setError('Full name is required'); return; }
    if (!phone.trim()) { setError('Phone number is required'); return; }
    setError('');
    setStep('consent');
  };

  const handleSign = async () => {
    if (!signature) { setError('Please sign the form before submitting'); return; }
    setError('');
    setSubmitting(true);

    try {
      const base64 = await generateConsentPDF(
        fullName.trim(), email.trim(), phone.trim(),
        challenges.trim(),
        meditationDays.trim(), dreamCount.trim(), conceptsAware,
        mentorName.trim(), mentorPhone.trim(),
        recordingConsent, signature, today
      );
      const filename = `HanumanHealing_${fullName.trim().replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      await uploadPDFToGitHub(filename, base64);

      postToSheet({
        type: 'hanuman_healing',
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        challenges: challenges.trim(),
        meditationDays: meditationDays.trim(),
        dreamCount: dreamCount.trim(),
        conceptsAware,
        mentorName: mentorName.trim(),
        mentorPhone: mentorPhone.trim(),
        recordingConsent,
        date: today,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Hanuman Healing submission error:', err);
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
        <div className="bg-white w-full max-w-lg rounded-t-3xl p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-4xl">🙏</div>
          <h3 className="text-2xl font-bold text-gray-800">Registration Complete!</h3>
          <p className="text-gray-500">Your Hanuman Healing session registration and signed consent form have been saved successfully.</p>
          <p className="text-sm text-purple-600 font-semibold">Payment: $500 via Zelle to master@waytomoksha.org</p>
          <button onClick={onClose}
            className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="px-5 pt-5 pb-3 shrink-0 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-800">🕉️ Hanuman Healing</h3>
              <p className="text-sm text-gray-400">
                {step === 'form' ? 'Session Registration' : 'Consent & Acknowledgment Form'}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none">✕</button>
          </div>
          {/* Step indicator */}
          <div className="flex gap-2 mt-3">
            {(['form', 'consent'] as Step[]).map((s, i) => (
              <div key={s} className={`flex-1 h-1.5 rounded-full ${step === s || (i === 0) ? 'bg-purple-600' : 'bg-gray-200'} ${step === 'consent' && i === 1 ? 'bg-purple-600' : ''}`} />
            ))}
          </div>
        </div>

        {step === 'form' ? (
          <>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">⚠️ {error}</p>}

              {/* Personal Info */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Your Details</p>
                <input type="text" placeholder="Full Name *" value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                <input type="tel" placeholder="Phone Number *" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                <input type="email" placeholder="Email Address (optional)" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>

              {/* Challenges */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Challenges / Intentions</p>
                <textarea placeholder="Share what you are seeking support with, your intentions, or areas of concern..." value={challenges}
                  onChange={(e) => setChallenges(e.target.value)} rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
              </div>

              {/* 4P Meditation & Dreams */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Practice Details</p>
                <input type="number" min="0" placeholder="How many days did you do 4P meditation?" value={meditationDays}
                  onChange={(e) => setMeditationDays(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                <input type="number" min="0" placeholder="How many dreams did you get?" value={dreamCount}
                  onChange={(e) => setDreamCount(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                <div>
                  <p className="text-sm text-gray-600 mb-2">Are you aware of all WayToMoksha concepts?</p>
                  <div className="flex gap-3">
                    {(['yes', 'no'] as const).map((val) => (
                      <button key={val} type="button" onClick={() => setConceptsAware(val)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 ${conceptsAware === val ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                        {val === 'yes' ? '✓ Yes' : '✕ No'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mentor Info */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Mentor Information</p>
                <input type="text" placeholder="Mentor Full Name" value={mentorName}
                  onChange={(e) => setMentorName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                <input type="tel" placeholder="Mentor Phone Number" value={mentorPhone}
                  onChange={(e) => setMentorPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>

              {/* Payment */}
              <div className="bg-blue-50 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">💳 Payment</p>
                <p className="text-2xl font-bold text-gray-800">$500</p>
                <div className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5">
                  <span className="text-xl">📱</span>
                  <div>
                    <p className="text-xs text-gray-400">Send via Zelle to</p>
                    <p className="text-blue-700 font-bold">master@waytomoksha.org</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-3 shrink-0">
              <button onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold active:scale-95">
                Cancel
              </button>
              <button onClick={handleRegister}
                className="flex-1 py-3 rounded-2xl bg-purple-600 text-white font-bold active:scale-95 shadow-md">
                Continue to Consent →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">⚠️ {error}</p>}

              {/* Pre-filled info */}
              <div className="bg-purple-50 rounded-2xl p-4 space-y-1">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Participant</p>
                <p className="font-bold text-gray-800">{fullName}</p>
                {email && <p className="text-sm text-gray-500">{email}</p>}
                <p className="text-sm text-gray-500">{phone}</p>
              </div>

              {/* Consent text */}
              <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-600 space-y-3 leading-relaxed">
                <p className="text-[10px] text-purple-800 bg-purple-50 rounded-xl p-2 font-medium">Please read this consent form carefully before signing.</p>

                <Section title="1. Introduction & Purpose">
                  Welcome to Hanuman Healing — a guided group meditation experience designed to support personal reflection, inner awareness, and holistic well-being. Trained meditators will hold a meditative space on your behalf. This practice is open to people of all backgrounds.
                </Section>
                <Section title="2. Nature of the Session">
                  Before the session you may share your concerns or intentions. During the session you will rest quietly while mediators meditate on your behalf. Afterwards, mediators will share their observations and suggestions — which you are free to accept or disregard.
                </Section>
                <Section title="3. Voluntary Participation">
                  <span className="font-semibold text-purple-700">Your participation is entirely voluntary.</span> You may withdraw at any point before, during, or after the session — without explanation and without any negative consequence.
                </Section>
                <Section title="4. Non-Medical Disclaimer">
                  Hanuman Healing is a spiritual and wellness practice only — not a medical treatment, psychological therapy, or professional counseling service. Nothing shared should be used as a substitute for professional medical advice.
                </Section>
                <Section title="5. Confidentiality">
                  Your personal information will be treated with discretion and will not be shared outside of the healing circle without your written consent.
                </Section>
                <Section title="6. Consent to Share Insights">
                  Insights shared by mediators are their personal subjective experiences and are not objective facts. You are free to receive, interpret, or disregard anything shared.
                </Section>
                <Section title="7. Emotional Responsibility">
                  Emotional material may arise during or after the session. You take personal responsibility for your emotional well-being. Facilitators are not licensed therapists.
                </Section>
                <Section title="8. No Guaranteed Outcomes">
                  Hanuman Healing makes no guarantees regarding results. Outcomes vary from person to person and cannot be predicted in advance.
                </Section>
                <Section title="9. Release of Liability">
                  By signing, you release Hanuman Healing facilitators, mediators, organizers, and hosts from any claims or liabilities arising from your participation. This does not apply in cases of gross negligence or willful misconduct.
                </Section>

                <p className="text-[10px] text-purple-800 bg-purple-50 rounded-xl p-2 font-semibold">
                  I have read and understood this consent form. I am participating freely and accept personal responsibility for my experience and well-being.
                </p>
              </div>

              {/* Recording consent */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Recording Consent (Section 10)</p>
                <div className="flex gap-3">
                  {[true, false].map((val) => (
                    <button key={String(val)} type="button" onClick={() => setRecordingConsent(val)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${recordingConsent === val ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                      {val ? '✓ Yes, I consent' : '✕ No recording'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Signature */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">✍️ Participant Signature — {fullName}</p>
                <SignatureCanvas onSign={setSignature} />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-3 shrink-0">
              <button onClick={() => { setStep('form'); setError(''); }}
                className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold active:scale-95">
                ← Back
              </button>
              <button onClick={handleSign} disabled={submitting}
                className="flex-1 py-3 rounded-2xl bg-purple-600 text-white font-bold active:scale-95 shadow-md disabled:opacity-50">
                {submitting ? '⏳ Saving...' : '✅ Sign & Register'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-purple-700 text-[11px] uppercase tracking-wide mb-1">{title}</p>
      <p>{children}</p>
    </div>
  );
}
