import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    // NOTA IMPORTANTE: Finché non verifichi un dominio su Resend, 
    // puoi inviare email SOLO a staffsuper.it@gmail.com (te stesso).
    // Per i test, forziamo l'invio alla tua mail.
    
    const data = await resend.emails.send({
      from: 'Gestione Richieste <onboarding@resend.dev>',
      to: ['staffsuper.it@gmail.com'], // In produzione useremo la mail del dipendente 'to'
      subject: subject,
      html: html,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error });
  }
}