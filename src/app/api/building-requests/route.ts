import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: Request) {
  try {
    const { name, email, buildingName } = await req.json();

    const msg = {
  to: "apluscleaningsolutions2025@gmail.com",
  from: process.env.SENDGRID_FROM!,
  subject: "New Building Request Submitted",
  html: `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px 0;">
      <tr>
        <td align="center">
          
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
            
            <!-- Header -->
            <tr>
              <td style="background:#1e293b; padding:20px; text-align:center;">
                <h1 style="color:#ffffff; margin:0; font-size:22px;">
                  New Building Request
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:30px;">
                <p style="margin:0 0 20px 0; font-size:16px; color:#333;">
                  A new building request has been submitted with the following details:
                </p>

                <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;">
                  <tr style="background:#f9fafb;">
                    <td style="font-weight:bold; border:1px solid #e5e7eb;">Name</td>
                    <td style="border:1px solid #e5e7eb;">${name}</td>
                  </tr>
                  <tr>
                    <td style="font-weight:bold; border:1px solid #e5e7eb;">Email</td>
                    <td style="border:1px solid #e5e7eb;">${email}</td>
                  </tr>
                  <tr style="background:#f9fafb;">
                    <td style="font-weight:bold; border:1px solid #e5e7eb;">Requested Building</td>
                    <td style="border:1px solid #e5e7eb;">${buildingName}</td>
                  </tr>
                </table>

                <p style="margin-top:25px; font-size:14px; color:#6b7280;">
                  Please review this request and take the necessary action.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f1f5f9; padding:15px; text-align:center; font-size:12px; color:#64748b;">
                © ${new Date().getFullYear()} A Plus Cleaning Solutions. All rights reserved.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `,
};

    await sgMail.send(msg);

    return NextResponse.json(
      { success: true, message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Building Request Email Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to send email" },
      { status: 500 }
    );
  }
}
