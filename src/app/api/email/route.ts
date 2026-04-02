// Signature block (HTML and plain text)
const signatureHTML = `
<table style="margin-top:32px; font-family:Arial,sans-serif; font-size:15px; color:#222;">
    <tr>
        <td style="vertical-align:top; padding-right:32px;">
            <div style="margin-bottom:4px; font-size:20px; color:#2563eb; font-weight:bold;">Scott Stringer</div>
            <div style="font-weight:bold; font-size:16px; color:#222; margin-bottom:2px;">Nurse Practitioner</div>
            <div style="font-size:14px; color:#222; margin-bottom:2px;">RN, MNursPrac, GCert R&R, GCert Emerg, BSN, ADN, Cert Imm</div>
            <div style="font-size:13px; color:#444;">Prison Health Services | Queensland Health</div>
        </td>
        <td style="vertical-align:top; padding-left:32px;">
            <table style="border-collapse:separate; border-spacing:0 10px;">
                <tr>
                    <td style="color:#059669; font-weight:bold; padding:0 12px 0 0; vertical-align:top;">P</td>
                    <td style="color:#222; vertical-align:top; text-align:left;">(07) 4123 7673</td>
                </tr>
                <tr>
                    <td style="color:#059669; font-weight:bold; padding:0 12px 0 0; vertical-align:top;">E</td>
                    <td style="color:#222; vertical-align:top; text-align:left;">scott.stringer@health.qld.gov.au</td>
                </tr>
                <tr>
                    <td style="color:#059669; font-weight:bold; padding:0 12px 0 0; vertical-align:top;">W</td>
                    <td style="vertical-align:top; text-align:left;">
                        <a href="https://www.health.qld.gov.au" style="color:#2563eb; text-decoration:underline;">www.health.qld.gov.au</a>
                    </td>
                </tr>
                <tr>
                    <td style="color:#059669; font-weight:bold; padding:0 12px 0 0; vertical-align:top;">A</td>
                    <td style="vertical-align:top; text-align:left;">
                        <a href="https://maps.google.com/?q=Maryborough+Correctional+Centre,+1+Stein+Road,+Aldershot+Q+4650" style="color:#2563eb; text-decoration:underline;">Maryborough Correctional Centre, 1 Stein Road, Aldershot Q 4650</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
`;

const signatureText = `
Scott Stringer
Nurse Practitioner
RN, MNursPrac, GCert R&R, GCert Emerg, BSN, ADN, Cert Imm
Prison Health Services | Queensland Health
P (07) 4123 7673
E scott.stringer@health.qld.gov.au
W www.health.qld.gov.au
A Maryborough Correctional Centre, 1 Stein Road, Aldershot Q 4650
`;
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Function to create appointment confirmation email
function createAppointmentConfirmationEmail(
    patientName: string,
    patientEmail: string,
    patientMobile: string,
    service: string,
    doctorName: string,
    appointmentDate: string,
    appointmentTime: string,
    notes?: string,
    isForPatient: boolean = false, // Add a flag to distinguish recipient
    meetLink?: string,
    type?: string,
    appointmentId?: string,
    refundNote?: string,
    baseUrl?: string
) {
    // Scott's contact details
    const scottEmail = "scotty.stringer@outlook.com";
    const scottPhone = "0410179900";

    const finalBaseUrl = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    let quickActions = '';

    if (type === 'booking_request' && !isForPatient && appointmentId) {
        quickActions = `
        <div style="text-align: center; margin-top: 30px;">
            <a href="${finalBaseUrl}/api/appointments/action?id=${appointmentId}&action=confirm" 
               style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">
                Confirm Booking
            </a>
            <a href="${finalBaseUrl}/api/appointments/action?id=${appointmentId}&action=reject" 
               style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">
                Reject Booking
            </a>
        </div>
        `;
    } else if (isForPatient) {
        quickActions = `
        <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:${scottEmail}?subject=Appointment Enquiry - ${service}" 
               style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">
                Contact Scott
            </a>
            <a href="tel:${scottPhone.replace(/[^0-9]/g, '')}" 
               style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">
                Call Scott
            </a>
        </div>
        `;
    } else {
        quickActions = `
        <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:${patientEmail}?subject=Re: Appointment Confirmation - ${service}" 
               style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">
                Reply to Patient
            </a>
            <a href="tel:${patientMobile}" 
               style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">
                Call Patient
            </a>
        </div>
        `;
    }

    let badgeContent = type === 'rejected'
        ? '<span style="background-color: #fef2f2; color: #dc2626; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; border: 2px solid #dc2626;">✗ Appointment Rejected</span>'
        : type === 'booking_request'
            ? '<span style="background-color: #fef3c7; color: #d97706; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; border: 2px solid #d97706;">⌛ Booking Request Pending</span>'
            : '<span style="background-color: #dcfce7; color: #16a34a; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; border: 2px solid #16a34a;">✓ Appointment Confirmed</span>';

    let headerText = type === 'rejected' ? 'Appointment Rejected' : type === 'booking_request' ? 'New Booking Request' : 'Appointment Confirmation';

    let actionRequiredText = 'Please prepare for the appointment and confirm attendance if required.';
    let actionRequiredTitle = '⚡ Action Required';
    let actionBoxStyle = 'background-color: #fef3c7; border: 1px solid #f59e0b; color: #92400e;';
    let actionTitleColor = '#92400e';
    let actionTextColor = '#92400e';

    if (type === 'booking_request' && isForPatient) {
        actionRequiredTitle = 'ℹ️ Booking Status';
        actionRequiredText = 'Your payment has been successfully processed. Your appointment is currently pending confirmation from Scott. If Scott approves, you will receive a confirmation email. If Scott rejects your appointment, your payment will be refunded to your original payment method automatically within 5-10 business days.';
        actionBoxStyle = 'background-color: #e0f2fe; border: 1px solid #0284c7;';
        actionTitleColor = '#075985';
        actionTextColor = '#075985';
    } else if (type === 'rejected') {
        actionRequiredTitle = 'ℹ️ Appointment Update';
        actionRequiredText = 'Your appointment request could not be fulfilled at this time.';
        actionBoxStyle = 'background-color: #fef2f2; border: 1px solid #dc2626;';
        actionTitleColor = '#991b1b';
        actionTextColor = '#991b1b';
    }

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Confirmation - AussieMale</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background-color: #00284C; padding: 30px 40px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">AussieMale</h1>
                <p style="color: #dbeafe; margin: 10px 0 0 0; font-size: 16px;">${headerText}</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px;">
                <!-- Confirmation Badge -->
                <div style="text-align: center; margin-bottom: 30px;">
                    ${badgeContent}
                </div>
                
                ${refundNote ? `
                <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
                    <p style="color: #b91c1c; margin: 0; font-weight: bold;">${refundNote}</p>
                </div>
                ` : ''}

                <!-- Appointment Details -->
                <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 25px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
                    <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">📅 Appointment Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 140px;">Service:</td>
                            <td style="padding: 8px 0; color: #1e293b;">${service}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Nurse Practitioner:</td>
                            <td style="padding: 8px 0; color: #1e293b;">${doctorName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Date:</td>
                            <td style="padding: 8px 0; color: #1e293b;">${new Date(appointmentDate).toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Time:</td>
                            <td style="padding: 8px 0; color: #1e293b;">${appointmentTime}</td>
                        </tr>
                        ${meetLink && type === 'confirmed' ? `
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569; vertical-align: top;">Video Link:</td>
                            <td style="padding: 8px 0;">
                                <a href="${meetLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">Join Video Consultation</a>
                                <div style="margin-top: 5px; font-size: 12px; color: #64748b; word-break: break-all;">${meetLink}</div>
                            </td>
                        </tr>` : ''}
                    </table>
                </div>

                <!-- Patient Information -->
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                    <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">👤 Patient Information</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 140px;">Name:</td>
                            <td style="padding: 8px 0; color: #1e293b;">${patientName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td>
                            <td style="padding: 8px 0; color: #1e293b;"><a href="mailto:${patientEmail}" style="color: #2563eb; text-decoration: none;">${patientEmail}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Mobile:</td>
                            <td style="padding: 8px 0; color: #1e293b;"><a href="tel:${patientMobile}" style="color: #2563eb; text-decoration: none;">${patientMobile}</a></td>
                        </tr>
                    </table>
                </div>

                ${notes ? `
                <!-- Additional Notes -->
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                    <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">📝 Additional Notes</h3>
                    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; border-left: 3px solid #2563eb;">
                        <p style="margin: 0; color: #334155; line-height: 1.6; white-space: pre-wrap;">${notes}</p>
                    </div>
                </div>
                ` : ''}

                <!-- Action Required -->
                <div style="${actionBoxStyle} padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                    <h4 style="color: ${actionTitleColor}; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">${actionRequiredTitle}</h4>
                    <p style="color: ${actionTextColor}; margin: 0; font-size: 14px;">${actionRequiredText}</p>
                </div>

                <!-- Quick Actions -->
                ${quickActions}
            </div>

            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; margin: 0; font-size: 14px;">
                    This appointment was booked via the AussieMale website.
                </p>
                <p style="color: #64748b; margin: 5px 0 0 0; font-size: 12px;">
                    Confirmed on ${new Date().toLocaleString('en-AU', {
        timeZone: 'Australia/Brisbane',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Function to create contact form email
function createContactFormEmail(
    name: string,
    email: string,
    phone: string,
    services: string,
    hearAbout: string,
    additionalInfo: string
) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Enquiry - AussieMale</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 30px 40px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">AussieMale</h1>
                <p style="color: #e0f7fa; margin: 10px 0 0 0; font-size: 16px;">New Customer Enquiry</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px;">
                <!-- Enquiry Type Badge -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <span style="background-color: #f0f9ff; color: #0891b2; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px; border: 2px solid #0891b2;">
                        ${services.charAt(0).toUpperCase() + services.slice(1).replace('-', ' ')} Service Enquiry
                    </span>
                </div>

                <!-- Customer Information -->
                <div style="background-color: #f8fafc; border-left: 4px solid #0891b2; padding: 25px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
                    <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">👤 Customer Information</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 140px;">Full Name:</td>
                            <td style="padding: 8px 0; color: #1e293b;">${name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email Address:</td>
                            <td style="padding: 8px 0; color: #1e293b;"><a href="mailto:${email}" style="color: #0891b2; text-decoration: none;">${email}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Phone Number:</td>
                            <td style="padding: 8px 0; color: #1e293b;"><a href="tel:${phone}" style="color: #0891b2; text-decoration: none;">${phone}</a></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Service Interest:</td>
                            <td style="padding: 8px 0; color: #1e293b;">${services.charAt(0).toUpperCase() + services.slice(1).replace('-', ' ')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Discovered AussieMale:</td>
                            <td style="padding: 8px 0; color: #1e293b;">${hearAbout.charAt(0).toUpperCase() + hearAbout.slice(1).replace('-', ' ')}</td>
                        </tr>
                    </table>
                </div>

                <!-- Project Details -->
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                    <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">📋 Enquiry Details</h3>
                    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; border-left: 3px solid #0891b2;">
                        <p style="margin: 0; color: #334155; line-height: 1.6; white-space: pre-wrap;">${additionalInfo}</p>
                    </div>
                </div>

                <!-- Action Required -->
                <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                    <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">⚡ Action Required</h4>
                    <p style="color: #92400e; margin: 0; font-size: 14px;">Please respond to this enquiry within 24 hours for the best customer experience.</p>
                </div>

                <!-- Quick Actions -->
                <div style="text-align: center; margin-top: 30px;">
                    <a href="mailto:${email}?subject=Re: ${services.charAt(0).toUpperCase() + services.slice(1).replace('-', ' ')} Service Enquiry" 
                       style="display: inline-block; background-color: #0891b2; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">
                        Reply to Customer
                    </a>
                    <a href="tel:${phone}" 
                       style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px;">
                        Call Customer
                    </a>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; margin: 0; font-size: 14px;">
                    This enquiry was submitted via the AussieMale website contact form.
                </p>
                <p style="color: #64748b; margin: 5px 0 0 0; font-size: 12px;">
                    Received on ${new Date().toLocaleString('en-AU', {
        timeZone: 'Australia/Brisbane',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}
                </p>
                ${signatureHTML}
            </div>
        </div>
    </body>
    </html>
    `;
}

// Function to create appointment confirmation text content
function createAppointmentTextContent(
    patientName: string,
    patientEmail: string,
    patientMobile: string,
    service: string,
    doctorName: string,
    appointmentDate: string,
    appointmentTime: string,
    notes?: string,
    meetLink?: string,
    type?: string
) {
    return `
AUSSIEMALE - APPOINTMENT CONFIRMATION
✓ Appointment Confirmed

APPOINTMENT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service: ${service}
Nurse Practitioner: ${doctorName}
Date: ${new Date(appointmentDate).toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}
Time: ${appointmentTime}
${meetLink && type === 'confirmed' ? `\nVIDEO CONSULTATION LINK:\nJoin here: ${meetLink}\n` : ''}
PATIENT INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${patientName}
Email: ${patientEmail}
Mobile: ${patientMobile}

${notes ? `ADDITIONAL NOTES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${notes}

` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTION REQUIRED: Please prepare for the appointment and confirm attendance if required.

Contact patient: ${patientEmail}
Call patient: ${patientMobile}

This appointment was booked via the AussieMale website.
Confirmed on ${new Date().toLocaleString('en-AU', {
        timeZone: 'Australia/Brisbane',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}

${signatureText}
    `;
}

// Function to create contact form text content
function createContactFormTextContent(
    name: string,
    email: string,
    phone: string,
    services: string,
    hearAbout: string,
    additionalInfo: string
) {
    return `
AUSSIEMALE - NEW CUSTOMER ENQUIRY
${services.charAt(0).toUpperCase() + services.slice(1).replace('-', ' ')} Service Enquiry

CUSTOMER INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full Name: ${name}
Email Address: ${email}
Phone Number: ${phone}
Service Interest: ${services.charAt(0).toUpperCase() + services.slice(1).replace('-', ' ')}
Discovered AussieMale: ${hearAbout.charAt(0).toUpperCase() + hearAbout.slice(1).replace('-', ' ')}

ENQUIRY DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${additionalInfo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTION REQUIRED: Please respond within 24 hours for optimal customer service.

Reply to customer: ${email}
Call customer: ${phone}

This enquiry was submitted via the AussieMale website contact form.
Received on ${new Date().toLocaleString('en-AU', {
        timeZone: 'Australia/Brisbane',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}

${signatureText}
    `;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Construct base URL from request headers for proper deployment URLs
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;

        // Check if this is an appointment booking email or contact form email
        const isAppointmentBooking = body.patientName && body.appointmentDate;

        let name, email, phone, services, hearAbout, additionalInfo;
        let doctorName, appointmentDate, appointmentTime, notes, meetLink, type, appointmentId, refundNote;

        if (isAppointmentBooking) {
            // Appointment booking fields
            ({
                patientName: name,
                patientEmail: email,
                patientMobile: phone,
                service: services,
                doctorName,
                appointmentDate,
                appointmentTime,
                notes: additionalInfo,
                meetLink,
                type,
                appointmentId,
                refundNote
            } = body);

            // Validate required fields for appointment
            if (!name || !email || !phone || !services || !doctorName || !appointmentDate || !appointmentTime) {
                return NextResponse.json(
                    { error: 'Missing required appointment booking fields' },
                    { status: 400 }
                );
            }
        } else {
            // Contact form fields (existing functionality)
            ({ name, email, phone, services, hearAbout, additionalInfo } = body);

            // Validate required fields for contact form
            if (!name || !email || !phone || !services || !hearAbout || !additionalInfo) {
                return NextResponse.json(
                    { error: 'All contact form fields are required' },
                    { status: 400 }
                );
            }
        }

        console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? `Set (${process.env.RESEND_API_KEY.substring(0, 10)}...)` : "Not set");

        // Check if Resend is configured
        if (!process.env.RESEND_API_KEY) {
            console.error("RESEND_API_KEY is not set");
            return NextResponse.json(
                { error: 'Resend API key not configured' },
                { status: 500 }
            );
        }

        // Validate email addresses
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email address provided' },
                { status: 400 }
            );
        }

        // Create email subject based on email type
        let subject = '';
        if (isAppointmentBooking) {
            if (type === 'booking_request') {
                subject = `New Booking Request - ${services} with ${name} - AussieMale`;
            } else if (type === 'rejected') {
                subject = `Appointment Rejected - ${services} with ${doctorName} - AussieMale`;
            } else {
                subject = `Appointment Confirmation - ${services} with ${doctorName} - AussieMale`;
            }
        } else {
            subject = `${services.charAt(0).toUpperCase() + services.slice(1).replace('-', ' ')} Service Enquiry - AussieMale`;
        }

        // Create professional HTML email content
        const htmlContent = isAppointmentBooking
            ? createAppointmentConfirmationEmail(name, email, phone, services, doctorName, appointmentDate, appointmentTime, additionalInfo, false, meetLink, type, appointmentId, refundNote, baseUrl)
            : createContactFormEmail(name, email, phone, services, hearAbout, additionalInfo);

        // Create plain text version
        const textContent = isAppointmentBooking
            ? createAppointmentTextContent(name, email, phone, services, doctorName, appointmentDate, appointmentTime, additionalInfo, meetLink, type)
            : createContactFormTextContent(name, email, phone, services, hearAbout, additionalInfo);

        // Use your verified sender address below:
        const verifiedSender = 'no-reply@aussiemale.com.au'; // <-- replace with your verified sender

        // Email to owner
        const ownerEmailData = {
            from: verifiedSender,
            to: ['gowthami.codot@gmail.com'],
            replyTo: email,
            subject: subject,
            html: htmlContent,
            text: textContent,
        };

        let ownerData = null, ownerError = null;
        if (!isAppointmentBooking || type === 'booking_request' || type === 'confirmed') {
            const result = await resend.emails.send(ownerEmailData);
            ownerData = result.data;
            ownerError = result.error;
        }

        // Email to user (only for appointment booking, types confirmed or rejected, and booking request)
        let userEmailResult = null;
        let userEmailError = null;
        if (isAppointmentBooking && (type === 'confirmed' || type === 'rejected' || type === 'booking_request')) {
            let userSubject = `Your Appointment is Confirmed - ${services} with ${doctorName} - AussieMale`;
            if (type === 'rejected') userSubject = `Your Appointment is Rejected - ${services} with ${doctorName} - AussieMale`;
            if (type === 'booking_request') userSubject = `Your Booking Request is Processing - ${services} with ${doctorName} - AussieMale`;

            const userHtmlContent = createAppointmentConfirmationEmail(name, email, phone, services, doctorName, appointmentDate, appointmentTime, additionalInfo, true, meetLink, type, appointmentId, refundNote);
            const userTextContent = createAppointmentTextContent(name, email, phone, services, doctorName, appointmentDate, appointmentTime, additionalInfo, meetLink, type);
            const userEmailData = {
                from: verifiedSender,
                to: [email],
                subject: userSubject,
                html: userHtmlContent,
                text: userTextContent,
            };
            // Send to user
            const { data: userData, error: userError } = await resend.emails.send(userEmailData);
            userEmailResult = userData;
            userEmailError = userError;
        }

        if (ownerError || userEmailError) {
            const errorMsg = [
                ownerError ? `Owner: ${ownerError.message || JSON.stringify(ownerError)}` : null,
                userEmailError ? `User: ${userEmailError.message || JSON.stringify(userEmailError)}` : null
            ].filter(Boolean).join(' | ');
            console.error('Resend error:', errorMsg);
            return NextResponse.json(
                { error: `Failed to send email(s): ${errorMsg}` },
                { status: 500 }
            );
        }

        console.log("Emails sent successfully via Resend!", { owner: ownerData, user: userEmailResult });
        return NextResponse.json(
            { message: 'Emails sent successfully!' },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Error sending email:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        // Handle specific Resend errors
        if (error.name === 'ResendError') {
            return NextResponse.json(
                { error: `Resend error: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: `Failed to send email: ${error.message || 'Unknown error occurred'}` },
            { status: 500 }
        );
    }
}