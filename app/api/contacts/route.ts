import { NextRequest, NextResponse } from 'next/server';
import { entityGetAll, entityCreate } from '@/lib/entity-storage-server';
import { notifyAdminNewSubmission } from '@/lib/send-notification';
import { sendInquiryConfirmationEmail } from '@/app/lib/email';
import { requireAdmin } from '@/server/middleware/authenticate';
import { contactFormSchema } from '@/app/lib/validation-schemas';
import { validatePublicSubmission } from '@/app/lib/security';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const items = entityGetAll('inquiries');
    const sorted = items.sort(
      (a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    return NextResponse.json(sorted);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const validation = await validatePublicSubmission(request, contactFormSchema, {
    rateLimit: 'strict',
    sanitizationRules: {
      name: 'text',
      email: 'email',
      subject: 'text',
      category: 'text',
      message: 'text'
    }
  });

  if (validation instanceof NextResponse) return validation;
  const body = validation.data;

  try {
    // Generate institutional tracking ID
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const inquiryId = `SP-INQ-${timestamp}${random}`;

    const record = entityCreate('inquiries', {
      ...body,
      inquiryId,
      status: 'submitted',
      priority: 'medium',
      submittedAt: new Date().toISOString(),
    });

    // Notify admin
    notifyAdminNewSubmission('institutional inquiry', body.name, body.subject || body.category).catch((err) => console.error('[notify]', err?.message || err));

    // Send confirmation email to user
    sendInquiryConfirmationEmail(body.email, {
      name: body.name,
      referenceId: inquiryId,
      category: body.category
    }).catch((err) => console.error('[email]', err?.message || err));

    return NextResponse.json(record, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
