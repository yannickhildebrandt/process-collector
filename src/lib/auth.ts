import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { prisma } from "./db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_xxx") {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "Process Collector <noreply@process-collector.app>",
            to: email,
            subject: "Your login link / Ihr Anmeldelink",
            html: `
              <p>Click the link below to sign in / Klicken Sie auf den Link, um sich anzumelden:</p>
              <p><a href="${url}">${url}</a></p>
              <p>This link expires in 15 minutes / Dieser Link läuft in 15 Minuten ab.</p>
            `,
          });
        } else {
          console.log(`[Magic Link] Email: ${email}, URL: ${url}`);
        }
      },
      expiresIn: 900, // 15 minutes in seconds
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "EMPLOYEE",
        input: true,
      },
      preferredLang: {
        type: "string",
        required: true,
        defaultValue: "EN",
        input: true,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
