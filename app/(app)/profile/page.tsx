import { ResetPasswordForm } from "./reset-password-form";

export default function ProfilePage() {
  return (
    <>
      <h1 style={{ marginTop: 0, fontSize: 24, fontWeight: 600 }}>Profile</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>
        Manage your account security.
      </p>
      <ResetPasswordForm />
    </>
  );
}
