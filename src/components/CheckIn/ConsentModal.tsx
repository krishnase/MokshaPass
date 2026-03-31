'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { postToSheet } from '@/lib/api';

export type PersonDetail = { name: string; age: string };

interface ConsentStep {
  type: 'adult' | 'minor';
  name: string;       // adult's name OR parent's name for minor form
  age: string;        // adult's age (blank for minor form parent row)
  phone: string;
  minors?: PersonDetail[];
}

interface Props {
  people: PersonDetail[];
  primaryPhone: string;
  onComplete: () => void;
  onCancel: () => void;
}

function buildSteps(people: PersonDetail[], primaryPhone: string): ConsentStep[] {
  const steps: ConsentStep[] = [];
  const adults = people.filter((p) => !p.age || Number(p.age) >= 18);
  const minors = people.filter((p) => !!p.age && Number(p.age) < 18);

  adults.forEach((adult, i) => {
    steps.push({ type: 'adult', name: adult.name, age: adult.age, phone: i === 0 ? primaryPhone : '' });
  });

  if (minors.length > 0) {
    const parent = adults[0] || people[0];
    steps.push({ type: 'minor', name: parent?.name || '', age: '', phone: primaryPhone, minors });
  }

  return steps;
}

// ─── PDF generator ────────────────────────────────────────────────────────────

async function generateAdultPDF(
  name: string, age: string, phone: string,
  signatureDataUrl: string, photoConsent: boolean, date: string
): Promise<string> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 170; const LM = 20; let y = 15;

  const wrap = (text: string, x: number, width: number, size: number) => {
    doc.setFontSize(size);
    return doc.splitTextToSize(text, width - (x - LM));
  };

  const line = (h = 5) => { y += h; };
  const rule = () => { doc.setDrawColor(180); doc.line(LM, y, LM + W, y); line(4); };

  // Header
  doc.setFillColor(90, 24, 154); doc.rect(LM - 5, y - 5, W + 10, 18, 'F');
  doc.setTextColor(255, 215, 0); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('WayToMoksha', LM + W / 2, y + 5, { align: 'center' });
  line(10);
  doc.setTextColor(255, 255, 255); doc.setFontSize(11);
  doc.text('Adult Participant Consent & Liability Waiver', LM + W / 2, y + 2, { align: 'center' });
  line(6);
  doc.setFontSize(9);
  doc.text('A Journey of Transformation Towards Inner Peace  •  April 2–5, 2026', LM + W / 2, y + 2, { align: 'center' });
  line(5);
  doc.text('Lone Oak Ranch & Retreat, Gainesville, TX  •  Outdoor Residential Retreat', LM + W / 2, y + 2, { align: 'center' });
  line(10);

  // Notice box
  doc.setTextColor(120, 80, 0); doc.setFillColor(255, 248, 220);
  doc.rect(LM, y, W, 12, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  const noticeLines = wrap('This form must be completed and signed by each adult participant (age 18 or older) individually. It constitutes a legally binding agreement under the laws of the State of Texas.', LM + 2, W - 4, 8);
  doc.text(noticeLines, LM + 2, y + 4);
  line(16);

  doc.setTextColor(30, 30, 30);

  // Section header helper
  const sectionHeader = (title: string) => {
    doc.setFillColor(90, 24, 154);
    doc.rect(LM, y, W, 7, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(title, LM + 2, y + 5);
    line(10); doc.setTextColor(30, 30, 30);
  };

  const bullet = (text: string) => {
    const lines = wrap('• ' + text, LM + 4, W - 4, 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(lines, LM + 4, y);
    line(lines.length * 4.5 + 1);
  };

  // Participant Details
  sectionHeader('PARTICIPANT DETAILS');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Full Legal Name:', LM, y); doc.setFont('helvetica', 'normal'); doc.text(name, LM + 32, y); rule();
  doc.setFont('helvetica', 'bold'); doc.text('Date of Birth:', LM, y); doc.setFont('helvetica', 'normal'); doc.text('', LM + 28, y);
  doc.setFont('helvetica', 'bold'); doc.text('Age:', LM + 80, y); doc.setFont('helvetica', 'normal'); doc.text(age, LM + 90, y); rule();
  doc.setFont('helvetica', 'bold'); doc.text('Mobile (with Country Code):', LM, y); doc.setFont('helvetica', 'normal'); doc.text(phone, LM + 56, y); rule();
  line(3);

  // Section 1
  sectionHeader('1.  HEALING & SPIRITUAL SESSIONS');
  bullet('I acknowledge that all healing sessions — including meditation, breathwork, energy healing, and astral guidance — are intended for spiritual growth, relaxation, and general well-being.');
  bullet('I understand these sessions are not a substitute for medical or psychological treatment, and that facilitators do not diagnose, treat, or cure any condition.');
  bullet('I agree to continue following the advice of my licensed healthcare providers throughout the retreat.');
  bullet('I may withdraw from any session or activity at any time, without obligation or penalty.');
  line(3);

  // Section 2
  sectionHeader('2.  ASSUMPTION OF RISK');
  doc.setTextColor(180, 0, 0); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('Please read this section carefully. By signing this form you are giving up certain legal rights.', LM + 2, y);
  line(6); doc.setTextColor(30, 30, 30);
  bullet('I fully understand that participation in this outdoor retreat involves inherent risks including but not limited to: uneven terrain, weather exposure (heat, wind, rain), insects, wildlife, physical exertion, and emotional or psychological responses during healing sessions.');
  bullet('I voluntarily and knowingly assume ALL risks associated with my participation, whether known or unknown, foreseen or unforeseen, at the time of signing this form.');
  bullet('I confirm I am physically and mentally fit to participate in this retreat and have consulted a healthcare provider if I had any doubts about my suitability.');
  bullet('I understand that Texas weather in early April may include heat, wind, or rain, and I take personal responsibility for preparing accordingly.');
  line(3);

  // Page 2
  doc.addPage(); y = 20;

  // Section 3
  sectionHeader('3.  RELEASE OF LIABILITY & INDEMNIFICATION');
  doc.setTextColor(180, 0, 0); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('This section limits WayToMoksha\'s legal liability. Read carefully before signing.', LM + 2, y);
  line(6); doc.setTextColor(30, 30, 30);
  bullet('In consideration of being permitted to participate in this retreat, I hereby release, waive, and discharge WayToMoksha, its organizers, facilitators, volunteers, and Lone Oak Ranch & Retreat, from any and all claims, demands, or causes of action arising out of my participation.');
  bullet('This release covers claims for personal injury, illness, emotional distress, property loss or damage, whether caused by negligence of the released parties or otherwise.');
  bullet('This release does NOT apply to claims arising from gross negligence, recklessness, or intentional misconduct by WayToMoksha or its facilitators.');
  bullet('I agree to indemnify and hold harmless WayToMoksha and Lone Oak Ranch & Retreat against any claims brought by third parties arising from my own actions during the retreat.');
  bullet('I understand that WayToMoksha and Lone Oak Ranch & Retreat are not liable for any loss, theft, or damage to my personal belongings.');
  line(3);

  // Section 4
  sectionHeader('4.  HEALTH, SAFETY & EMERGENCIES');
  bullet('I confirm I have disclosed or will disclose at check-in any known medical conditions, allergies, or physical limitations relevant to safe participation.');
  bullet('In the event of a medical emergency, I consent to retreat staff contacting emergency services (911) and to necessary emergency medical care being provided.');
  bullet('I understand that the venue is in a rural area and emergency response times may be longer than in an urban setting.');
  bullet('I confirm I am not under the influence of alcohol or non-prescribed substances and agree to remain so for the duration of the retreat.');
  line(3);

  // Section 5
  sectionHeader('5.  ACCOMMODATION, CONDUCT & MEDIA');
  bullet('I understand that accommodation and all meals are included in the registration fee (Check-in: April 2nd, 3:00 PM – Check-out: April 5th, 4:00 PM).');
  bullet('I agree to treat all shared accommodation, ranch facilities, and common areas with care and respect. Disruptive or harmful behaviour may result in removal from the retreat without refund.');
  bullet('I agree to abide by the facility rules of Lone Oak Ranch & Retreat including quiet hours, fire safety regulations, and use of shared spaces.');
  bullet('I agree not to venture beyond designated retreat areas, especially after dark, without informing retreat staff.');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(`• Photo / Video Consent: I  [${photoConsent ? 'X' : '  '}] CONSENT  /  [${!photoConsent ? 'X' : '  '}] DO NOT CONSENT  to photographs and videos of me being used on WayToMoksha's website and social media.`, LM + 4, y, { maxWidth: W - 4 });
  line(8);
  bullet('I agree not to record sessions, fellow participants, or facilitators without prior written consent from WayToMoksha.');
  line(3);

  // Section 6
  sectionHeader('6.  GOVERNING LAW & SEVERABILITY');
  bullet('This agreement shall be governed exclusively by the laws of the State of Texas. Any disputes arising from this agreement shall be resolved in Cooke County, Texas.');
  bullet('If any provision of this agreement is found to be unenforceable by a court of law, the remaining provisions shall continue in full force and effect.');
  bullet('This agreement constitutes the entire understanding between the participant and WayToMoksha with respect to the subject matter herein.');
  line(4);

  // Confirmation text
  doc.setFillColor(240, 230, 255);
  const confText = 'I confirm that I am 18 years of age or older. I have read this entire document, I fully understand its contents, and I agree to all terms voluntarily and of my own free will. I understand that by signing I am waiving certain legal rights. I confirm that all information I have provided is accurate and complete.';
  const confLines = doc.splitTextToSize(confText, W - 4);
  doc.rect(LM, y, W, confLines.length * 4.5 + 6, 'F');
  doc.setTextColor(60, 10, 100); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text(confLines, LM + 2, y + 5);
  line(confLines.length * 4.5 + 10);

  // Signature line
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Full Legal Name', LM, y); doc.text('Signature', LM + 95, y); line(5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(name, LM, y);
  if (signatureDataUrl) {
    doc.addImage(signatureDataUrl, 'PNG', LM + 90, y - 12, 70, 18);
  }
  rule(); rule();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Date', LM, y); doc.text('Staff Witness', LM + 95, y); line(5);
  doc.setFont('helvetica', 'normal'); doc.text(date, LM, y);
  rule();

  // Footer
  doc.setFillColor(90, 24, 154);
  doc.rect(LM - 5, y + 5, W + 10, 10, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'italic');
  doc.text('WayToMoksha  •  Dallas, TX  •  www.waytomoksha.org', LM + W / 2, y + 11, { align: 'center' });
  line(6);
  doc.text('ADULT CONSENT & LIABILITY WAIVER — Governed by the laws of the State of Texas  •  Form v1.0 Apr 2026', LM + W / 2, y + 5, { align: 'center' });

  return doc.output('datauristring').split(',')[1];
}

async function generateMinorPDF(
  parentName: string, parentPhone: string,
  minors: PersonDetail[],
  signatureDataUrl: string, photoConsent: boolean, date: string
): Promise<string> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 170; const LM = 20; let y = 15;

  const wrap = (text: string, x: number, width: number, size: number) => {
    doc.setFontSize(size);
    return doc.splitTextToSize(text, width - (x - LM));
  };

  const line = (h = 5) => { y += h; };
  const rule = () => { doc.setDrawColor(180); doc.line(LM, y, LM + W, y); line(4); };

  // Header
  doc.setFillColor(90, 24, 154); doc.rect(LM - 5, y - 5, W + 10, 18, 'F');
  doc.setTextColor(255, 215, 0); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('WayToMoksha', LM + W / 2, y + 5, { align: 'center' });
  line(10);
  doc.setTextColor(255, 255, 255); doc.setFontSize(11);
  doc.text('Minor Participant Consent Form', LM + W / 2, y + 2, { align: 'center' });
  line(6);
  doc.setFontSize(9);
  doc.text('A Journey of Transformation Towards Inner Peace  •  April 2–5, 2026', LM + W / 2, y + 2, { align: 'center' });
  line(5);
  doc.text('Lone Oak Ranch & Retreat, Gainesville, TX  •  Outdoor Residential Retreat', LM + W / 2, y + 2, { align: 'center' });
  line(10);

  // Notice box
  doc.setTextColor(180, 0, 0); doc.setFillColor(255, 235, 235);
  doc.rect(LM, y, W, 16, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  const noticeLines = wrap('IMPORTANT LEGAL NOTICE: This form grants participation and emergency medical consent for minor children only. It does not waive or release any legal rights the minor may have. Under Texas law, a parent or guardian cannot waive a minor\'s right to seek legal remedy for negligence on their behalf.', LM + 2, W - 4, 8);
  doc.text(noticeLines, LM + 2, y + 4);
  line(20);

  doc.setTextColor(30, 30, 30);

  const sectionHeader = (title: string) => {
    doc.setFillColor(90, 24, 154);
    doc.rect(LM, y, W, 7, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(title, LM + 2, y + 5);
    line(10); doc.setTextColor(30, 30, 30);
  };

  const bullet = (text: string) => {
    const lines = wrap('• ' + text, LM + 4, W - 4, 8);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(lines, LM + 4, y);
    line(lines.length * 4.5 + 1);
  };

  // Parent Details
  sectionHeader('PARENT / GUARDIAN DETAILS');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Parent / Guardian Full Name:', LM, y); doc.setFont('helvetica', 'normal'); doc.text(parentName, LM + 58, y); rule();
  doc.setFont('helvetica', 'bold'); doc.text('Mobile (with Country Code):', LM, y); doc.setFont('helvetica', 'normal'); doc.text(parentPhone, LM + 56, y); rule();
  doc.setFont('helvetica', 'bold'); doc.text('Home Address / City:', LM, y); rule();
  line(3);

  // Minors table
  sectionHeader('MINOR CHILDREN ATTENDING');
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(80, 80, 80);
  doc.text('List all minor (under 18) children for whom you are providing consent:', LM, y); line(6);
  doc.setTextColor(30, 30, 30);

  // Table header
  doc.setFillColor(90, 24, 154);
  doc.rect(LM, y, W * 0.7, 7, 'F');
  doc.rect(LM + W * 0.7, y, W * 0.3, 7, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text("Minor's Full Name", LM + W * 0.35, y + 5, { align: 'center' });
  doc.text('Age', LM + W * 0.85, y + 5, { align: 'center' });
  line(8); doc.setTextColor(30, 30, 30);

  // Table rows
  const rowH = 8;
  for (let i = 0; i < Math.max(minors.length, 4); i++) {
    const minor = minors[i];
    doc.setFillColor(i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 240 : 255, i % 2 === 0 ? 255 : 255);
    doc.rect(LM, y, W * 0.7, rowH, 'F');
    doc.rect(LM + W * 0.7, y, W * 0.3, rowH, 'F');
    doc.setDrawColor(200); doc.rect(LM, y, W * 0.7, rowH); doc.rect(LM + W * 0.7, y, W * 0.3, rowH);
    if (minor) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      doc.text(minor.name, LM + 3, y + 5.5);
      doc.text(minor.age, LM + W * 0.7 + W * 0.15, y + 5.5, { align: 'center' });
    }
    y += rowH;
  }
  line(5);

  // Sections 1 & 2
  sectionHeader('1.  PARTICIPATION CONSENT');
  bullet('I give permission for the minor children listed above to attend and participate in the WayToMoksha 3-Day Retreat, including all scheduled sessions such as meditation, breathwork, energy healing, and outdoor activities.');
  bullet('I understand that sessions are intended for spiritual growth, relaxation, and general well-being, and are not a substitute for medical or psychological treatment.');
  bullet('I confirm that the minor children listed are physically and emotionally able to participate in gentle outdoor and indoor retreat activities.');
  bullet('I understand that any minor may withdraw from any session or activity at any time, without penalty.');
  bullet('I confirm that I, as parent or guardian, will remain on the retreat premises for the duration and will be accessible to retreat staff at all times during the retreat.');
  line(3);

  sectionHeader('2.  OUTDOOR ACTIVITIES CONSENT');
  bullet('I acknowledge that this is an outdoor residential retreat at a ranch property. Activities may take place in open-air settings including fields, gardens, and open grounds.');
  bullet('I acknowledge that outdoor environments carry inherent risks including uneven terrain, weather exposure, insects, and wildlife, and I voluntarily consent to my children\'s participation with full awareness of these conditions.');
  bullet('I agree to ensure the minor children are dressed appropriately for outdoor Texas weather conditions (which may include heat, wind, or rain in early April).');
  bullet('I agree that the minor children will not venture beyond designated retreat areas, especially after dark, without my direct supervision or explicit permission from retreat staff.');
  line(3);

  // Page 2
  doc.addPage(); y = 20;

  sectionHeader('3.  EMERGENCY MEDICAL CONSENT');
  doc.setTextColor(90, 24, 154); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('This section grants authority for emergency medical care only. It does not authorize any elective, experimental, or non-emergency procedures.', LM + 2, y, { maxWidth: W - 4 });
  line(10); doc.setTextColor(30, 30, 30);
  bullet('In the event of a medical emergency involving any minor listed above, I authorize retreat staff to contact emergency services (911) immediately.');
  bullet('I authorize licensed emergency medical personnel to provide necessary emergency medical treatment to the minor(s) listed above if I cannot be reached in time.');
  bullet('I understand that the retreat is located in a rural area and that emergency response times may be longer than in an urban setting.');
  bullet('I agree to inform retreat staff of any known medical conditions, allergies, medications, or special needs for each minor prior to or at check-in.');
  bullet('I understand and accept that WayToMoksha staff are not licensed medical providers and will defer all medical decisions to qualified emergency personnel.');
  line(3);

  sectionHeader('4.  CONDUCT & MEDIA CONSENT');
  bullet('I agree to ensure that the minor children in my care are respectful of fellow participants, facilitators, and the sanctity of the retreat space at all times.');
  bullet('I understand that disruptive or harmful behaviour may result in the minor and accompanying guardian being asked to leave the retreat.');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(`• Photo / Video Consent for Minors: I  [${photoConsent ? 'X' : '  '}] CONSENT  /  [${!photoConsent ? 'X' : '  '}] DO NOT CONSENT  to photographs and videos of the minor(s) being taken for use on WayToMoksha's website and social media platforms.`, LM + 4, y, { maxWidth: W - 4 });
  line(10);
  bullet('I agree that the minor children will not record sessions, fellow participants, or facilitators without prior written consent from WayToMoksha.');
  line(3);

  sectionHeader('5.  MINOR\'S MEDICAL DETAILS');
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(80, 80, 80);
  doc.text('Please provide any medical information relevant to safe participation (kept strictly confidential):', LM, y); line(6);
  doc.setTextColor(30, 30, 30);

  const medField = (label: string) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(label, LM, y + 4); rule();
  };
  medField('Known medical conditions:');
  medField('Medications currently taking:');
  medField('Allergies (food / environmental):');
  medField('Dietary restrictions:');
  medField('Primary care physician & phone:');
  line(4);

  // Declaration
  doc.setFillColor(240, 230, 255);
  const declText = 'I declare that I am the parent or legal guardian of all minor children listed in this form. I have read and fully understood this consent form. I am granting participation and emergency medical consent only — I am not waiving or releasing any legal rights belonging to the minor children. I confirm all information provided is accurate and complete to the best of my knowledge.';
  const declLines = doc.splitTextToSize(declText, W - 4);
  doc.rect(LM, y, W, declLines.length * 4.5 + 6, 'F');
  doc.setTextColor(60, 10, 100); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text(declLines, LM + 2, y + 5);
  line(declLines.length * 4.5 + 10);

  // Signature
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Parent / Guardian Full Name', LM, y); doc.text('Signature', LM + 95, y); line(5);
  doc.setFont('helvetica', 'normal');
  doc.text(parentName, LM, y);
  if (signatureDataUrl) {
    doc.addImage(signatureDataUrl, 'PNG', LM + 90, y - 12, 70, 18);
  }
  rule(); rule();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Date', LM, y); doc.text('Staff Witness', LM + 95, y); line(5);
  doc.setFont('helvetica', 'normal'); doc.text(date, LM, y);
  rule();

  // Footer
  doc.setFillColor(90, 24, 154);
  doc.rect(LM - 5, y + 5, W + 10, 10, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'italic');
  doc.text('WayToMoksha  •  Dallas, TX  •  www.waytomoksha.org', LM + W / 2, y + 11, { align: 'center' });
  line(6);
  doc.text('MINOR CONSENT FORM — This document grants participation & emergency medical consent only. Not a liability waiver.', LM + W / 2, y + 5, { align: 'center' });

  return doc.output('datauristring').split(',')[1];
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
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

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
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    onSign('');
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
        <button onClick={clear} className="mt-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
          ✕ Clear signature
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ConsentModal({ people, primaryPhone, onComplete, onCancel }: Props) {
  const steps = buildSteps(people, primaryPhone);
  const [stepIdx, setStepIdx] = useState(0);
  const [signature, setSignature] = useState('');
  const [photoConsent, setPhotoConsent] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const signatures = useRef<string[]>([]);

  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleNext = async () => {
    if (!signature) { setError('Please sign before continuing.'); return; }
    setError('');
    signatures.current[stepIdx] = signature;

    if (isLast) {
      setUploading(true);
      try {
        for (let i = 0; i < steps.length; i++) {
          const s = steps[i];
          const sig = signatures.current[i] || '';
          let base64: string;
          let filename: string;
          if (s.type === 'adult') {
            base64 = await generateAdultPDF(s.name, s.age, s.phone, sig, photoConsent, today);
            filename = `Consent_Adult_${s.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
          } else {
            base64 = await generateMinorPDF(s.name, s.phone, s.minors || [], sig, photoConsent, today);
            filename = `Consent_Minor_${s.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
          }
          postToSheet({ type: 'pdf', content: base64, filename, folderId: '1LkjYLY-D_-ACgkMoOzYzH_SXVIla2QPJ' });
        }
      } catch (err) {
        console.error('PDF upload error:', err);
      }
      setUploading(false);
      onComplete();
    } else {
      setStepIdx((i) => i + 1);
      setSignature('');
    }
  };

  if (!step) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[95vh] flex flex-col">
        {/* Progress bar */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-800 text-base">
              {step.type === 'adult' ? '📋 Adult Consent Form' : '👨‍👩‍👧 Minor Consent Form'}
            </h3>
            <span className="text-xs text-gray-400 font-medium">Form {stepIdx + 1} of {steps.length}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        {/* Form content */}
        <div className="overflow-y-auto flex-1 px-5 pb-2 space-y-4">

          {/* Participant info card */}
          {step.type === 'adult' ? (
            <div className="bg-purple-50 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Participant Details</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-400">Full Legal Name</p>
                  <p className="font-semibold text-gray-800 text-sm">{step.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Age</p>
                  <p className="font-semibold text-gray-800 text-sm">{step.age || '—'}</p>
                </div>
                {step.phone && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Mobile</p>
                    <p className="font-semibold text-gray-800 text-sm">{step.phone}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-purple-50 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Parent / Guardian</p>
              <div>
                <p className="text-xs text-gray-400">Full Name</p>
                <p className="font-semibold text-gray-800 text-sm">{step.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Mobile</p>
                <p className="font-semibold text-gray-800 text-sm">{step.phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Minor Children</p>
                <table className="w-full text-sm border border-purple-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-purple-600 text-white">
                      <th className="text-left px-3 py-1.5 text-xs font-semibold">Name</th>
                      <th className="text-center px-3 py-1.5 text-xs font-semibold w-16">Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {step.minors?.map((m, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-purple-50'}>
                        <td className="px-3 py-1.5 font-medium text-gray-800">{m.name}</td>
                        <td className="px-3 py-1.5 text-center text-gray-600">{m.age}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Legal text */}
          <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-600 space-y-3 leading-relaxed">
            {step.type === 'adult' ? (
              <>
                <p className="text-[10px] text-amber-700 bg-amber-50 rounded-xl p-2 font-medium">This form must be completed and signed by each adult participant (age 18 or older) individually. It constitutes a legally binding agreement under the laws of the State of Texas.</p>
                <Section title="1. HEALING & SPIRITUAL SESSIONS">
                  I acknowledge that all healing sessions — including meditation, breathwork, energy healing, and astral guidance — are intended for spiritual growth, relaxation, and general well-being. These sessions are not a substitute for medical or psychological treatment. I may withdraw from any session at any time, without penalty.
                </Section>
                <Section title="2. ASSUMPTION OF RISK">
                  <span className="text-red-600 font-semibold">By signing this form you are giving up certain legal rights.</span> I voluntarily and knowingly assume ALL risks associated with my participation including uneven terrain, weather exposure, insects, wildlife, and physical exertion. I confirm I am physically and mentally fit to participate.
                </Section>
                <Section title="3. RELEASE OF LIABILITY & INDEMNIFICATION">
                  <span className="text-red-600 font-semibold">This section limits WayToMoksha's legal liability.</span> I hereby release, waive, and discharge WayToMoksha, its organizers, facilitators, volunteers, and Lone Oak Ranch & Retreat from any and all claims arising out of my participation. This release does NOT apply to gross negligence or intentional misconduct.
                </Section>
                <Section title="4. HEALTH, SAFETY & EMERGENCIES">
                  I confirm I have disclosed any known medical conditions. In the event of a medical emergency, I consent to retreat staff contacting emergency services (911) and to necessary emergency medical care being provided.
                </Section>
                <Section title="5. ACCOMMODATION, CONDUCT & MEDIA">
                  Accommodation and meals are included (Check-in: April 2nd 3:00 PM – Check-out: April 5th 4:00 PM). I agree to treat shared spaces with care and respect. Disruptive behavior may result in removal without refund.
                </Section>
                <Section title="6. GOVERNING LAW">
                  This agreement is governed by the laws of the State of Texas. Any disputes shall be resolved in Cooke County, Texas.
                </Section>
                <p className="text-[10px] text-purple-800 bg-purple-50 rounded-xl p-2 font-semibold">I confirm that I am 18 years of age or older. I have read this entire document, I fully understand its contents, and I agree to all terms voluntarily and of my own free will.</p>
              </>
            ) : (
              <>
                <p className="text-[10px] text-red-700 bg-red-50 rounded-xl p-2 font-semibold">IMPORTANT LEGAL NOTICE: This form grants participation and emergency medical consent for minor children only. It does not waive or release any legal rights the minor may have. Under Texas law, a parent or guardian cannot waive a minor's right to seek legal remedy for negligence on their behalf.</p>
                <Section title="1. PARTICIPATION CONSENT">
                  I give permission for the minor children listed above to attend and participate in the WayToMoksha 3-Day Retreat. Sessions are not a substitute for medical treatment. I confirm I, as parent/guardian, will remain on the retreat premises at all times.
                </Section>
                <Section title="2. OUTDOOR ACTIVITIES CONSENT">
                  I acknowledge that outdoor environments carry inherent risks including uneven terrain, weather exposure, insects, and wildlife, and I voluntarily consent to my children's participation.
                </Section>
                <Section title="3. EMERGENCY MEDICAL CONSENT">
                  <span className="text-purple-700 font-semibold">For emergency medical care only.</span> In the event of a medical emergency, I authorize retreat staff to contact emergency services (911) and authorize licensed emergency medical personnel to provide necessary treatment if I cannot be reached.
                </Section>
                <Section title="4. CONDUCT & MEDIA CONSENT">
                  I agree to ensure the minor children in my care are respectful of fellow participants, facilitators, and the sanctity of the retreat space at all times.
                </Section>
                <Section title="5. MINOR'S MEDICAL DETAILS">
                  I will inform retreat staff of any known medical conditions, allergies, medications, or special needs for each minor at check-in.
                </Section>
                <p className="text-[10px] text-purple-800 bg-purple-50 rounded-xl p-2 font-semibold">I declare that I am the parent or legal guardian of all minor children listed. I am granting participation and emergency medical consent only — I am not waiving any legal rights belonging to the minor children.</p>
              </>
            )}
          </div>

          {/* Photo/video consent */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-600 mb-3">
              {step.type === 'minor' ? 'Photo / Video Consent for Minors' : 'Photo / Video Consent'}
            </p>
            <div className="flex gap-3">
              {[true, false].map((val) => (
                <button key={String(val)} onClick={() => setPhotoConsent(val)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${photoConsent === val ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {val ? '✓ Consent' : '✕ Do Not Consent'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              I {photoConsent ? 'CONSENT' : 'DO NOT CONSENT'} to photographs and videos being used on WayToMoksha&apos;s website and social media.
            </p>
          </div>

          {/* Signature */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              ✍️ {step.type === 'minor' ? `Parent / Guardian Signature (${step.name})` : `Signature (${step.name})`}
            </p>
            <SignatureCanvas key={stepIdx} onSign={setSignature} />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3">⚠️ {error}</p>}
        </div>

        {/* Footer buttons */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm active:scale-95 transition-transform">
            Cancel
          </button>
          <button onClick={handleNext} disabled={uploading}
            className="flex-2 flex-1 py-3 rounded-2xl bg-purple-600 text-white font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 shadow-md">
            {uploading ? '⏳ Saving...' : isLast ? '✅ Sign & Complete Check-In' : `Sign & Continue →`}
          </button>
        </div>
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
