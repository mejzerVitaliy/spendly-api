import { environmentVariables } from '@/config';
import { Resend } from 'resend';

const resend = new Resend(environmentVariables.RESEND_API_KEY);

const sendWelcomeEmail = async (to: string) => {
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: to,
      subject: 'Welcome to Spendly!',
      html: '<p>Welcome to <strong>Spendly</strong>! Thanks for joining us.</p>',
    });

    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: to,
      subject: subject,
      html: html,
    });

    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

export const emailService = {
  sendWelcomeEmail,
  sendEmail,
};
