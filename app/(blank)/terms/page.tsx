import Link from "next/link";
import { LegalDoc } from "@/components/legal-doc";

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of Use">
      <p>
        Welcome to Inventory Book. By creating an account or using the app, you
        agree to these Terms of Use.
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>1. What this app is for</h2>
      <p>
        Inventory Book is a personal inventory tool. You can record items you
        own — everyday gear, household stuff, hobbies, or anything else you
        want to track for yourself.
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>2. Your account</h2>
      <p>
        You are responsible for keeping your login credentials safe and for
        activity under your account. Do not share your password with others.
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>3. Your content</h2>
      <p>
        Items you enter belong to you. You decide what to store. This includes
        ordinary inventory and private or personal items. If you want to record
        something intimate (yes — even adult products or anything you would
        rather keep to yourself), that is fine. Use the system and enjoy it.
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>4. Acceptable use</h2>
      <p>
        Do not use Inventory Book to break the law, attack the service, or try
        to access other users&apos; data. We may suspend accounts that abuse the
        system.
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>5. No warranty</h2>
      <p>
        The service is provided as-is. We try hard to keep it running and
        useful, but we do not guarantee uninterrupted access or perfect
        backups.
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>6. Privacy</h2>
      <p>
        How we handle your data is explained in our{" "}
        <Link href="/privacy" style={{ color: "#1677ff" }}>
          Privacy Policy
        </Link>
        . Please read it.
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>7. Contact</h2>
      <p>
        Questions about these terms can be sent to the site operator (AndrewL).
      </p>
    </LegalDoc>
  );
}
