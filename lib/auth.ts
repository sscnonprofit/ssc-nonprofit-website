import { betterAuth } from "better-auth"
import { twoFactor } from "better-auth/plugins"
import { eq } from "drizzle-orm"

import { db, pool } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"
import { sendEmail } from "@/lib/email/send"
import { passwordChangedEmail, passwordResetEmail, verificationCodeEmail, welcomeStaffEmail } from "@/lib/email/templates"

const OTP_MINUTES = 5

export const auth = betterAuth({
  plugins: [
    twoFactor({
      issuer: "Sheboygan Senior Community",
      // Sign-in codes are delivered by email through Resend; no authenticator app needed.
      skipVerificationOnEnable: true,
      otpOptions: {
        period: OTP_MINUTES,
        digits: 6,
        sendOTP: async ({ user, otp }) => {
          const result = await sendEmail({
            kind: "two-factor-code",
            to: user.email,
            ...verificationCodeEmail({ name: user.name || "there", code: otp, minutes: OTP_MINUTES }),
          })
          if (!result.ok) throw new Error("We couldn't email your sign-in code. Please try again.")
        },
      },
    }),
  ],
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({ kind: "password-reset", to: user.email, ...passwordResetEmail({ name: user.name || "there", url }) })
    },
    onPasswordReset: async ({ user }) => {
      await sendEmail({ kind: "password-changed", to: user.email, ...passwordChangedEmail({ name: user.name || "there" }) })
    },
  },
  trustedOrigins: [
    ...(process.env.NODE_ENV === "development"
      ? [
          "http://localhost:3000",
          ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
          ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
          ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
          ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),
        ]
      : []),
    ...(process.env.NODE_ENV === "production"
      ? [
          ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
          ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
            : []),
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "editor",
        // Only the server-side hook below sets this — never trust a
        // client-supplied role on sign-up.
        input: false,
      },
      disabled: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        // Suspended accounts cannot start a new session.
        before: async (newSession) => {
          const [account] = await db
            .select({ disabled: userTable.disabled })
            .from(userTable)
            .where(eq(userTable.id, newSession.userId))
            .limit(1)
          if (account?.disabled) return false
          return { data: newSession }
        },
      },
    },
    user: {
      create: {
        // The very first account created becomes the admin so the CMS has an
        // owner from day one; everyone who signs up after that is an editor
        // who can draft content but not publish or manage other users.
        before: async (newUser) => {
          const existing = await db.$count(userTable)
          return { data: { ...newUser, role: existing === 0 ? "admin" : "editor" } }
        },
        after: async (createdUser) => {
          const [account] = await db.select({ role: userTable.role }).from(userTable).where(eq(userTable.id, createdUser.id)).limit(1)
          await sendEmail({
            kind: "welcome-staff",
            to: createdUser.email,
            ...welcomeStaffEmail({ name: createdUser.name || "there", role: account?.role ?? "editor" }),
          })
        },
      },
    },
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          // Required by the cross-site v0 preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})
