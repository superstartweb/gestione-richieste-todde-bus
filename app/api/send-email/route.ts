export const dynamic = 'force-dynamic'; // LA PAROLINA MAGICA

import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    const data = await resend.emails.send({
      from: 'Gestione Richieste <onboarding@resend.dev>',
      to: ['staffsuper.it@gmail.com'], 
      subject: subject,
      html: html,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}