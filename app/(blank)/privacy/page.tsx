import Link from "next/link";
import { LegalDoc } from "@/components/legal-doc";

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy">
      <p>
        This Privacy Policy explains how Inventory Book handles information you
        store in the app. Plain language first.
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>1. What we collect</h2>
      <p>
        We store your account email, password hash (not your plain password),
        and the inventory items you create (name, description, quantity, unit,
        and related timestamps).
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>2. Other people cannot see your data</h2>
      <p>
        Your items are tied to your user account. Other users of the app cannot
        browse or read what you entered. Inventory Book is built so each person
        only sees their own records.
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>
        3. Honesty about encryption
      </h2>
      <p>
        We want to be clear: data in the database is <strong>not</strong>{" "}
        end-to-end encrypted field-by-field. Technical operators with server or
        database access could theoretically read stored values. That said, we
        do not sell your inventory list, and we do not expose it to other
        accounts.
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>
        4. The owner will not snoop on your entries
      </h2>
      <p>
        AndrewL (the operator of this project) will not casually open the
        database to look at what you typed — your shopping lists, gadgets,
        private belongings, or anything else. Your inventory is yours. Even if
        you track personal or adult items here, that is your business. Enjoy
        the system without worrying that someone is peeking for fun.
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>5. Protecting the database</h2>
      <p>
        We will try our best to protect the database: keep access limited,
        maintain sensible server hygiene, and avoid careless exposure. No system
        is perfect, but protecting user data is a real priority for this
        project.
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>6. When access might happen</h2>
      <p>
        Database access may still be needed for maintenance, backups, fixing
        outages, or investigating abuse/security issues. That is operational
        work — not curiosity about your item names.
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>7. Your choices</h2>
      <p>
        You can edit or delete your items at any time from the app. If you want
        your account removed, contact the operator.
      </p>

      <h2 style={{ fontSize: 18, margin: "8px 0 0" }}>8. Terms</h2>
      <p>
        Using Inventory Book also means you agree to the{" "}
        <Link href="/terms" style={{ color: "#1677ff" }}>
          Terms of Use
        </Link>
        .
      </p>
    </LegalDoc>
  );
}
