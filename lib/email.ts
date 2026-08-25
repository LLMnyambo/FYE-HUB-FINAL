import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(email: string, name: string, link: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'FYE Hub <onboarding@resend.dev>',
      to: [email],
      subject: 'Verify your FYE Hub Account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 40px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .header { text-align: center; border-bottom: 3px solid #1B5E20; padding-bottom: 20px; }
              .header h1 { color: #1B5E20; margin: 0; }
              .subheader { color: #F9A825; font-size: 14px; }
              .content { padding: 30px 0; }
              .button { display: inline-block; background: #1B5E20; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎓 FYE Hub</h1>
                <p class="subheader">University of Mpumalanga</p>
              </div>
              <div class="content">
                <h2>Welcome to FYE Hub, ${name}!</h2>
                <p>Thank you for registering for the First Year Experience Hub. Please verify your email address to get started.</p>
                <p style="text-align: center;">
                  <a href="${link}" class="button">Verify My Account</a>
                </p>
                <p>Or copy this link into your browser:</p>
                <p style="background: #f4f4f4; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 14px;">
                  ${link}
                </p>
                <p>This link will expire in 24 hours.</p>
              </div>
              <div class="footer">
                <p>&copy; 2026 University of Mpumalanga. All rights reserved.</p>
                <p>If you didn't create this account, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Error sending email:', error)
      return { error }
    }

    return { data }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { error }
  }
}