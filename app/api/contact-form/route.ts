import { NextResponse } from "next/server";
import { Resend } from "resend";
import prisma from "@/lib/prisma"; // Added import for Prisma client

// Khởi tạo Resend với API key từ biến môi trường
// Đảm bảo bạn đã cài đặt `resend` và đặt RESEND_API_KEY trong file .env
const resendApiKey = process.env.RESEND_API_KEY;
let resend: Resend | null = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
} else {
  console.warn("RESEND_API_KEY is not set. Email sending will be disabled.");
}

// Email admin mặc định - sẽ được override bởi email từ DB nếu có
const DEFAULT_ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "21126063@student.hcmus.edu.vn";
const FROM_EMAIL =
  process.env.FROM_EMAIL || "Portfolio <onboarding@resend.dev>"; // Thay bằng email/domain đã xác thực trên Resend

export async function POST(request: Request) {
  let adminEmailToUse = DEFAULT_ADMIN_EMAIL;

  try {
    // Lấy admin email từ database
    const contactInfoAdminEmail = await prisma.contactInfoItem.findFirst({
      where: {
        type: "email",
      },
      orderBy: {
        order: "asc",
      },
    });

    if (contactInfoAdminEmail && contactInfoAdminEmail.value) {
      adminEmailToUse = contactInfoAdminEmail.value.trim();
      console.log(`Using admin email from DB: ${adminEmailToUse}`);
    } else {
      console.log(
        `Admin email not found in DB, using default: ${adminEmailToUse}`
      );
    }
  } catch (dbError) {
    console.error("Error fetching admin email from DB:", dbError);
    // Không chặn việc gửi email nếu lỗi DB, vẫn dùng email mặc định
    // nhưng log lại lỗi để debug
  }

  // Kiểm tra xem Resend đã được khởi tạo chưa
  if (!resend) {
    return NextResponse.json(
      { message: "Email service is not configured on the server." },
      { status: 503 } // Service Unavailable
    );
  }

  try {
    const body = await request.json();
    const { email, subject, message } = body;

    // --- Validation ---
    if (!email || !subject || !message) {
      return NextResponse.json(
        { message: "Missing required fields: email, subject, message" },
        { status: 400 }
      );
    }
    // Simple email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    console.log(
      `Sending email from ${email} with subject ${subject} to ${adminEmailToUse}`
    );

    // --- Gửi Email bằng Resend ---
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminEmailToUse],
      subject: `Portfolio Contact: ${subject}`,
      replyTo: email,
      html: `
        <p>You received a new message from your portfolio contact form:</p>
        <p><strong>From:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      return NextResponse.json(
        { message: "Error sending email", error: error.message },
        { status: 500 }
      );
    }

    console.log("Email sent successfully:", data);
    return NextResponse.json(
      { message: "Email sent successfully!", data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing contact form:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        message: "Internal Server Error",
        errorDetails: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
