export const defaultTemplates = [
  {
    id: 't-1',
    name: 'Employment Certificate',
    description: 'General certificate with worker details.',
    createdAt: new Date().toISOString(),
    content: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; font-size: 14px;">
  <p style="text-align:right; margin:0 0 18px 0;">Date: {{todayDate}}</p>
  <h1 style="text-align:center; margin:0 0 24px 0; font-size:24px;">EMPLOYMENT CERTIFICATE</h1>
  <p style="margin:0 0 14px 0;">This is to certify that <strong>{{name}}</strong>, holder of CIN <strong>{{cin}}</strong>, is employed with our company under a <strong>{{contractType}}</strong> contract.</p>
  <p style="margin:0 0 14px 0;">Start date: <strong>{{entryDate}}</strong></p>
  <p style="margin:0 0 24px 0;">Current position: <strong>{{position}}</strong></p>
  <p style="margin:0 0 56px 0;">This certificate is delivered upon request for all legal purposes.</p>
  <p style="margin:0;">Stamp</p>
</div>`,
  },
]
